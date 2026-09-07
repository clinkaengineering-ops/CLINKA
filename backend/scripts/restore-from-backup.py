#!/usr/bin/env python3
"""Restore wiped relational data from database_backup.sql after UUID migration.

Maps backup integer User.id → current prod User.id via email.
Maps backup integer Project.id → deterministic uuid5(project_{id}).
Keeps EngineerProfile.id (and other int PKs) so Bid/Payment/Portfolio FKs stay valid.
Does NOT modify User rows.
"""

from __future__ import annotations

import os
import re
import sys
import uuid
from pathlib import Path

import psycopg2
from psycopg2.extras import execute_values

ROOT = Path(__file__).resolve().parents[2]
BACKUP = ROOT / "database_backup.sql"
NS = uuid.NAMESPACE_URL
DB_URL = os.environ.get("DATABASE_URL")
if not DB_URL:
    print("Set DATABASE_URL to the Postgres connection string", file=sys.stderr)
    raise SystemExit(1)


def parse_copy_blocks(path: Path) -> dict[str, tuple[list[str], list[list[str]]]]:
    text = path.read_text(encoding="utf-8")
    blocks: dict[str, tuple[list[str], list[list[str]]]] = {}
    pattern = re.compile(
        r'COPY public\."([^"]+)" \(([^)]+)\) FROM stdin;\n(.*?)(?<=\n)\\.\n',
        re.S,
    )
    for m in pattern.finditer(text):
        table = m.group(1)
        cols = [c.strip().strip('"') for c in m.group(2).split(",")]
        rows = []
        for line in m.group(3).splitlines():
            if not line:
                continue
            rows.append(line.split("\t"))
        blocks[table] = (cols, rows)
    return blocks


def nullify(v: str):
    if v == "\\N":
        return None
    return v


def project_uuid(old_id: int | str) -> str:
    return str(uuid.uuid5(NS, f"project_{old_id}"))


def main() -> int:
    if not BACKUP.exists():
        print(f"Missing backup: {BACKUP}", file=sys.stderr)
        return 1

    blocks = parse_copy_blocks(BACKUP)
    print("Parsed tables:", ", ".join(sorted(blocks)))

    conn = psycopg2.connect(DB_URL)
    conn.autocommit = False
    cur = conn.cursor()

    # email → prod uuid
    cur.execute('SELECT id, email FROM "User"')
    prod_by_email = {email: uid for uid, email in cur.fetchall()}
    print(f"Prod users: {len(prod_by_email)}")

    user_cols, user_rows = blocks["User"]
    email_i = user_cols.index("email")
    id_i = user_cols.index("id")
    backup_user_to_prod: dict[str, str] = {}
    missing = []
    for row in user_rows:
        bid = row[id_i]
        email = row[email_i]
        if email not in prod_by_email:
            missing.append(email)
            continue
        backup_user_to_prod[bid] = prod_by_email[email]
    if missing:
        print("Users in backup missing from prod:", missing)
        return 1
    print(f"User id map: {len(backup_user_to_prod)}")

    def map_user(val: str | None) -> str | None:
        if val is None:
            return None
        if val not in backup_user_to_prod:
            raise KeyError(f"No prod user for backup user id {val}")
        return backup_user_to_prod[val]

    def map_project(val: str | None) -> str | None:
        if val is None:
            return None
        return project_uuid(val)

    def rows_as_dicts(table: str) -> list[dict]:
        cols, rows = blocks[table]
        return [{cols[i]: nullify(r[i]) for i in range(len(cols))} for r in rows]

    # Wipe dependent data we are about to fully restore (keep Users / migrations / settings)
    wipe = [
        "PortfolioProjectSkill",
        "PortfolioFile",
        "PortfolioItem",
        "ProfileSpecialization",
        "ProfileSkill",
        "ProfileServiceArea",
        "ProfileLanguage",
        "ProfileCertification",
        "ProfileAnalytics",
        "ProjectDeliverable",
        "ProjectSubmission",
        "InvitationEvent",
        "Message",
        "Conversation",
        "ManualPaymentSubmission",
        "PaymentLedgerEntry",
        "PayoutAuditLog",
        "WithdrawalRequest",
        "WalletTransaction",
        "Review",
        "Bid",
        "Payment",
        "ProjectInvitation",
        "Dispute",
        "Ban",
        "Notification",
        "EngineerProfile",
        "Project",
        "Wallet",
        # lookups
        "Specialization",
        "Skill",
        "SkillCategory",
        "Discipline",
        "Language",
        "ServiceArea",
        "Certification",
    ]
    cur.execute("SET session_replication_role = replica")  # bypass FK checks while wiping/loading
    for table in wipe:
        cur.execute(f'TRUNCATE TABLE "{table}" RESTART IDENTITY CASCADE')
        print(f"Truncated {table}")

    def insert(table: str, cols: list[str], values: list[tuple]):
        if not values:
            print(f"Skip empty {table}")
            return
        cols_sql = ", ".join(f'"{c}"' for c in cols)
        execute_values(
            cur,
            f'INSERT INTO "{table}" ({cols_sql}) VALUES %s',
            values,
            page_size=200,
        )
        print(f"Inserted {len(values)} → {table}")

    # --- Lookups ---
    for table in [
        "Discipline",
        "SkillCategory",
        "Skill",
        "Language",
        "Specialization",
        "ServiceArea",
        "Certification",
    ]:
        cols, rows = blocks[table]
        insert(table, cols, [tuple(nullify(x) for x in r) for r in rows])

    # --- EngineerProfile (remap userId, keep id) ---
    ep_rows = rows_as_dicts("EngineerProfile")
    ep_cols = [
        "id",
        "userId",
        "specialty",
        "bio",
        "verificationStatus",
        "averageRating",
        "totalReviews",
        "createdAt",
        "coverImageUrl",
        "nationality",
        "nationalId",
        "about",
        "acceptsConsultations",
        "acceptsDirectMessages",
        "acceptsInvitations",
        "availabilityStatus",
        "coverBannerUrl",
        "currentCompany",
        "currentPosition",
        "expectedStartDate",
        "hourlyRateUSD",
        "linkedinUrl",
        "professionalHeadline",
        "profileCompletion",
        "profileVisibility",
        "slug",
        "startingProjectPriceUSD",
        "verificationLevel",
        "websiteUrl",
        "yearsOfExperience",
    ]
    insert(
        "EngineerProfile",
        ep_cols,
        [
            tuple(
                map_user(r["userId"]) if c == "userId" else r.get(c)
                for c in ep_cols
            )
            for r in ep_rows
        ],
    )

    # --- Portfolio ---
    pi_rows = rows_as_dicts("PortfolioItem")
    # backup column imageUrl == DB imageUrl
    pi_cols = [
        "id",
        "engineerId",
        "imageUrl",
        "description",
        "createdAt",
        "clientName",
        "country",
        "disciplineId",
        "status",
        "title",
        "year",
    ]
    insert(
        "PortfolioItem",
        pi_cols,
        [tuple(r.get(c) for c in pi_cols) for r in pi_rows],
    )

    for table in ["PortfolioFile", "PortfolioProjectSkill"]:
        cols, rows = blocks[table]
        insert(table, cols, [tuple(nullify(x) for x in r) for r in rows])

    for table in [
        "ProfileAnalytics",
        "ProfileCertification",
        "ProfileLanguage",
        "ProfileServiceArea",
        "ProfileSkill",
        "ProfileSpecialization",
    ]:
        cols, rows = blocks[table]
        insert(table, cols, [tuple(nullify(x) for x in r) for r in rows])

    # --- Projects ---
    proj_rows = rows_as_dicts("Project")
    proj_cols = [
        "id",
        "clientId",
        "title",
        "description",
        "budget",
        "serviceType",
        "status",
        "createdAt",
        "updatedAt",
        "isFlagged",
        "progressNote",
        "progressUpdatedAt",
        "deliveredAt",
        "disputePausedAt",
        "disputeWindowClosesAt",
    ]
    insert(
        "Project",
        proj_cols,
        [
            tuple(
                map_project(r["id"])
                if c == "id"
                else map_user(r["clientId"])
                if c == "clientId"
                else r.get(c)
                for c in proj_cols
            )
            for r in proj_rows
        ],
    )

    # --- Bids ---
    bid_rows = rows_as_dicts("Bid")
    bid_cols = [
        "id",
        "projectId",
        "engineerId",
        "price",
        "duration",
        "description",
        "status",
        "createdAt",
    ]
    insert(
        "Bid",
        bid_cols,
        [
            tuple(
                map_project(r["projectId"])
                if c == "projectId"
                else r.get(c)
                for c in bid_cols
            )
            for r in bid_rows
        ],
    )

    # --- Invitations before conversations/payments that reference them ---
    inv_rows = rows_as_dicts("ProjectInvitation")
    inv_cols = [
        "id",
        "projectId",
        "engineerId",
        "clientId",
        "status",
        "expiresAt",
        "createdAt",
        "updatedAt",
    ]
    insert(
        "ProjectInvitation",
        inv_cols,
        [
            tuple(
                map_project(r["projectId"])
                if c == "projectId"
                else map_user(r["engineerId"])
                if c == "engineerId"
                else map_user(r["clientId"])
                if c == "clientId"
                else r.get(c)
                for c in inv_cols
            )
            for r in inv_rows
        ],
    )

    ie_rows = rows_as_dicts("InvitationEvent")
    ie_cols = ["id", "invitationId", "event", "actorId", "metadata", "createdAt"]
    insert(
        "InvitationEvent",
        ie_cols,
        [
            tuple(
                map_user(r["actorId"]) if c == "actorId" else r.get(c)
                for c in ie_cols
            )
            for r in ie_rows
        ],
    )

    # --- Payments ---
    pay_rows = rows_as_dicts("Payment")
    # DB column is still "amount" (mapped from amountUsd in Prisma)
    pay_cols = [
        "id",
        "projectId",
        "clientId",
        "engineerId",
        "amount",
        "commission",
        "status",
        "createdAt",
        "updatedAt",
        "gatewayInvoiceId",
        "gatewayInvoiceKey",
        "amountEgp",
        "exchangeProvider",
        "exchangeRate",
        "invitationId",
        "providerTimestamp",
        "rateFetchedAt",
        "provider",
        "isAdminOverride",
    ]
    insert(
        "Payment",
        pay_cols,
        [
            tuple(
                map_project(r["projectId"])
                if c == "projectId"
                else map_user(r["clientId"])
                if c == "clientId"
                else r.get(c)
                for c in pay_cols
            )
            for r in pay_rows
        ],
    )

    for table in ["PaymentLedgerEntry", "ManualPaymentSubmission"]:
        cols, rows = blocks[table]
        mapped = []
        for r in rows:
            d = {cols[i]: nullify(r[i]) for i in range(len(cols))}
            if "verifiedBy" in d and d["verifiedBy"] is not None:
                d["verifiedBy"] = map_user(d["verifiedBy"])
            mapped.append(tuple(d[c] for c in cols))
        insert(table, cols, mapped)

    # --- Conversations / Messages ---
    conv_rows = rows_as_dicts("Conversation")
    conv_cols = [
        "id",
        "projectId",
        "clientId",
        "engineerId",
        "createdAt",
        "clientLastReadAt",
        "engineerLastReadAt",
        "invitationId",
    ]
    insert(
        "Conversation",
        conv_cols,
        [
            tuple(
                map_project(r["projectId"])
                if c == "projectId"
                else map_user(r["clientId"])
                if c == "clientId"
                else map_user(r["engineerId"])
                if c == "engineerId"
                else r.get(c)
                for c in conv_cols
            )
            for r in conv_rows
        ],
    )

    msg_rows = rows_as_dicts("Message")
    msg_cols = [
        "id",
        "conversationId",
        "senderId",
        "content",
        "createdAt",
        "attachmentUrl",
        "attachmentName",
        "attachmentMime",
    ]
    insert(
        "Message",
        msg_cols,
        [
            tuple(
                map_user(r["senderId"]) if c == "senderId" else r.get(c)
                for c in msg_cols
            )
            for r in msg_rows
        ],
    )

    # --- Reviews / Notifications / Ban ---
    rev_rows = rows_as_dicts("Review")
    rev_cols = [
        "id",
        "projectId",
        "clientId",
        "engineerId",
        "rating",
        "comment",
        "createdAt",
    ]
    insert(
        "Review",
        rev_cols,
        [
            tuple(
                map_project(r["projectId"])
                if c == "projectId"
                else map_user(r["clientId"])
                if c == "clientId"
                else r.get(c)
                for c in rev_cols
            )
            for r in rev_rows
        ],
    )

    notif_rows = rows_as_dicts("Notification")
    notif_cols = ["id", "userId", "type", "title", "body", "link", "read", "createdAt"]
    insert(
        "Notification",
        notif_cols,
        [
            tuple(
                map_user(r["userId"]) if c == "userId" else r.get(c)
                for c in notif_cols
            )
            for r in notif_rows
        ],
    )

    ban_rows = rows_as_dicts("Ban")
    ban_cols = [
        "id",
        "userId",
        "reason",
        "bannedAt",
        "expiresAt",
        "bannedById",
        "note",
        "active",
        "triggerMessage",
    ]
    insert(
        "Ban",
        ban_cols,
        [
            tuple(
                map_user(r["userId"])
                if c == "userId"
                else map_user(r["bannedById"])
                if c == "bannedById"
                else r.get(c)
                for c in ban_cols
            )
            for r in ban_rows
        ],
    )

    ps_rows = rows_as_dicts("ProjectSubmission")
    ps_cols = ["id", "projectId", "engineerId", "notes", "revisionNote", "createdAt"]
    insert(
        "ProjectSubmission",
        ps_cols,
        [
            tuple(
                map_project(r["projectId"]) if c == "projectId" else r.get(c)
                for c in ps_cols
            )
            for r in ps_rows
        ],
    )

    cols, rows = blocks["ProjectDeliverable"]
    insert("ProjectDeliverable", cols, [tuple(nullify(x) for x in r) for r in rows])

    disp_rows = rows_as_dicts("Dispute")
    disp_cols = [
        "id",
        "projectId",
        "openedById",
        "reason",
        "status",
        "openedAt",
        "updatedAt",
        "resolvedAt",
        "resolvedById",
        "resolutionNote",
    ]
    insert(
        "Dispute",
        disp_cols,
        [
            tuple(
                map_project(r["projectId"])
                if c == "projectId"
                else map_user(r["openedById"])
                if c == "openedById"
                else map_user(r["resolvedById"])
                if c == "resolvedById"
                else r.get(c)
                for c in disp_cols
            )
            for r in disp_rows
        ],
    )

    # --- Wallets ---
    wal_rows = rows_as_dicts("Wallet")
    wal_cols = [
        "id",
        "userId",
        "availableBalance",
        "pendingBalance",
        "createdAt",
        "updatedAt",
        "version",
        "heldByDispute",
    ]
    insert(
        "Wallet",
        wal_cols,
        [
            tuple(
                map_user(r["userId"]) if c == "userId" else r.get(c)
                for c in wal_cols
            )
            for r in wal_rows
        ],
    )

    cols, rows = blocks["WalletTransaction"]
    insert("WalletTransaction", cols, [tuple(nullify(x) for x in r) for r in rows])

    # Withdrawals (may be empty)
    if "WithdrawalRequest" in blocks and blocks["WithdrawalRequest"][1]:
        wr_rows = rows_as_dicts("WithdrawalRequest")
        # Only insert columns that exist on both sides; get live columns
        cur.execute(
            """
            SELECT column_name FROM information_schema.columns
            WHERE table_schema='public' AND table_name='WithdrawalRequest'
            """
        )
        live = {r[0] for r in cur.fetchall()}
        wr_cols = [c for c in blocks["WithdrawalRequest"][0] if c in live]
        userish = {
            "userId",
            "approvedById",
            "completedById",
            "rejectedById",
        }
        values = []
        for r in wr_rows:
            values.append(
                tuple(
                    map_user(r[c]) if c in userish and r.get(c) is not None else r.get(c)
                    for c in wr_cols
                )
            )
        insert("WithdrawalRequest", wr_cols, values)

    if "PayoutAuditLog" in blocks and blocks["PayoutAuditLog"][1]:
        pa_rows = rows_as_dicts("PayoutAuditLog")
        pa_cols = blocks["PayoutAuditLog"][0]
        insert(
            "PayoutAuditLog",
            pa_cols,
            [
                tuple(
                    map_user(r["actorId"])
                    if c == "actorId" and r.get("actorId") is not None
                    else r.get(c)
                    for c in pa_cols
                )
                for r in pa_rows
            ],
        )

    cur.execute("SET session_replication_role = DEFAULT")

    # Fix sequences
    for table, seq in [
        ("EngineerProfile", '"EngineerProfile_id_seq"'),
        ("Bid", '"Bid_id_seq"'),
        ("Payment", '"Payment_id_seq"'),
        ("PortfolioItem", '"PortfolioItem_id_seq"'),
        ("Conversation", '"Conversation_id_seq"'),
        ("Message", '"Message_id_seq"'),
        ("Notification", '"Notification_id_seq"'),
        ("Wallet", '"Wallet_id_seq"'),
        ("Ban", '"Ban_id_seq"'),
        ("Review", '"Review_id_seq"'),
    ]:
        cur.execute(
            f"""
            SELECT setval(
              '{seq}',
              COALESCE((SELECT MAX(id) FROM "{table}"), 1),
              true
            )
            """
        )

    # Verify
    cur.execute(
        """
        SELECT
          (SELECT COUNT(*) FROM "EngineerProfile") AS profiles,
          (SELECT COUNT(*) FROM "User" WHERE role='ENGINEER') AS engineers,
          (SELECT COUNT(*) FROM "EngineerProfile" ep
             JOIN "User" u ON u.id = ep."userId"
             WHERE u.role='ENGINEER') AS linked,
          (SELECT COUNT(*) FROM "Project") AS projects,
          (SELECT COUNT(*) FROM "Bid") AS bids,
          (SELECT COUNT(*) FROM "PortfolioItem") AS portfolio
        """
    )
    print("Verify:", cur.fetchone())

    cur.execute(
        """
        SELECT u.email, ep.id, ep.specialty, ep."verificationStatus"
        FROM "User" u
        JOIN "EngineerProfile" ep ON ep."userId" = u.id
        WHERE u.role='ENGINEER'
        ORDER BY u.email
        """
    )
    print("Engineer profiles restored:")
    for row in cur.fetchall():
        print(" ", row)

    conn.commit()
    cur.close()
    conn.close()
    print("DONE")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as e:
        print("FAILED:", e, file=sys.stderr)
        raise
