--
-- PostgreSQL database dump
--

\restrict Hfd3ci07Q1jotsGnzrvTpdGjbQ4xJdUdXoSFAGqoI3Qex58SHTfnMXZAkKaGgki

-- Dumped from database version 17.10
-- Dumped by pg_dump version 18.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: AvailabilityStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AvailabilityStatus" AS ENUM (
    'AVAILABLE_NOW',
    'OPEN_TO_WORK',
    'AVAILABLE_NEXT_WEEK',
    'AVAILABLE_NEXT_MONTH',
    'UNAVAILABLE'
);


ALTER TYPE public."AvailabilityStatus" OWNER TO postgres;

--
-- Name: BanReason; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."BanReason" AS ENUM (
    'CONTACT_INFO_SHARING',
    'MANUAL_BAN'
);


ALTER TYPE public."BanReason" OWNER TO postgres;

--
-- Name: BidStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."BidStatus" AS ENUM (
    'PENDING',
    'ACCEPTED',
    'REJECTED'
);


ALTER TYPE public."BidStatus" OWNER TO postgres;

--
-- Name: DeliverableType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."DeliverableType" AS ENUM (
    'FILE',
    'LINK'
);


ALTER TYPE public."DeliverableType" OWNER TO postgres;

--
-- Name: DisputeStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."DisputeStatus" AS ENUM (
    'OPEN',
    'AWAITING_ENGINEER_FIX',
    'ESCALATED_TO_ADMIN',
    'RESOLVED_ENGINEER',
    'RESOLVED_CLIENT'
);


ALTER TYPE public."DisputeStatus" OWNER TO postgres;

--
-- Name: EngineerSpecialty; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."EngineerSpecialty" AS ENUM (
    'CIVIL',
    'ARCHITECTURAL'
);


ALTER TYPE public."EngineerSpecialty" OWNER TO postgres;

--
-- Name: InvitationEventType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."InvitationEventType" AS ENUM (
    'SENT',
    'VIEWED',
    'ACCEPTED',
    'DECLINED',
    'CANCELLED',
    'EXPIRED'
);


ALTER TYPE public."InvitationEventType" OWNER TO postgres;

--
-- Name: InvitationStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."InvitationStatus" AS ENUM (
    'PENDING',
    'ACCEPTED',
    'DECLINED',
    'EXPIRED',
    'CANCELLED'
);


ALTER TYPE public."InvitationStatus" OWNER TO postgres;

--
-- Name: ManualPaymentStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ManualPaymentStatus" AS ENUM (
    'PENDING',
    'VERIFIED',
    'REJECTED'
);


ALTER TYPE public."ManualPaymentStatus" OWNER TO postgres;

--
-- Name: PaymentLedgerType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PaymentLedgerType" AS ENUM (
    'FUNDED',
    'ENGINEER_ESCROW',
    'PLATFORM_COMMISSION',
    'RELEASED',
    'REFUNDED'
);


ALTER TYPE public."PaymentLedgerType" OWNER TO postgres;

--
-- Name: PaymentProvider; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PaymentProvider" AS ENUM (
    'PAYMOB',
    'MANUAL'
);


ALTER TYPE public."PaymentProvider" OWNER TO postgres;

--
-- Name: PaymentStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PaymentStatus" AS ENUM (
    'PENDING',
    'RELEASED',
    'REFUNDED',
    'FUNDED'
);


ALTER TYPE public."PaymentStatus" OWNER TO postgres;

--
-- Name: PayoutAuditEvent; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PayoutAuditEvent" AS ENUM (
    'CREATED',
    'BALANCE_HELD',
    'SUBMITTED',
    'PAYMOB_RESPONSE',
    'CALLBACK_RECEIVED',
    'INQUIRY_UPDATED',
    'COMPLETED',
    'FAILED',
    'CANCELLED',
    'REVERSED',
    'BALANCE_RELEASED',
    'ADMIN_OVERRIDE',
    'RECONCILIATION',
    'ADMIN_APPROVED',
    'ADMIN_REJECTED',
    'ADMIN_VIEWED_BANK_DETAILS',
    'TRANSFER_INITIATED',
    'IDEMPOTENT_REQUEST_REUSED'
);


ALTER TYPE public."PayoutAuditEvent" OWNER TO postgres;

--
-- Name: PayoutType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PayoutType" AS ENUM (
    'PAYMOB',
    'IBAN',
    'INSTAPAY',
    'E_WALLET'
);


ALTER TYPE public."PayoutType" OWNER TO postgres;

--
-- Name: PortfolioFileType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PortfolioFileType" AS ENUM (
    'IMAGE',
    'PDF',
    'LINK'
);


ALTER TYPE public."PortfolioFileType" OWNER TO postgres;

--
-- Name: PortfolioProjectStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PortfolioProjectStatus" AS ENUM (
    'DRAFT',
    'PUBLISHED',
    'ARCHIVED'
);


ALTER TYPE public."PortfolioProjectStatus" OWNER TO postgres;

--
-- Name: ProfileVisibility; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ProfileVisibility" AS ENUM (
    'PUBLIC',
    'PRIVATE',
    'HIDDEN'
);


ALTER TYPE public."ProfileVisibility" OWNER TO postgres;

--
-- Name: ProjectStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ProjectStatus" AS ENUM (
    'OPEN',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
    'AWAITING_APPROVAL',
    'SUBMITTED_FOR_REVIEW',
    'REVISION_REQUESTED',
    'AWAITING_PAYMENT',
    'CLOSED'
);


ALTER TYPE public."ProjectStatus" OWNER TO postgres;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Role" AS ENUM (
    'CLIENT',
    'ENGINEER',
    'ADMIN'
);


ALTER TYPE public."Role" OWNER TO postgres;

--
-- Name: ServiceType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ServiceType" AS ENUM (
    'DESIGN',
    'SUPERVISION',
    'REVIEW'
);


ALTER TYPE public."ServiceType" OWNER TO postgres;

--
-- Name: SupportTicketStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."SupportTicketStatus" AS ENUM (
    'OPEN',
    'SOLVED',
    'UNRESOLVED'
);


ALTER TYPE public."SupportTicketStatus" OWNER TO postgres;

--
-- Name: VerificationLevel; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."VerificationLevel" AS ENUM (
    'BASIC',
    'COMPLETE',
    'VERIFIED',
    'TOP_ENGINEER'
);


ALTER TYPE public."VerificationLevel" OWNER TO postgres;

--
-- Name: VerificationStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."VerificationStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);


ALTER TYPE public."VerificationStatus" OWNER TO postgres;

--
-- Name: WalletTransactionStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."WalletTransactionStatus" AS ENUM (
    'PENDING',
    'AVAILABLE',
    'COMPLETED',
    'REJECTED'
);


ALTER TYPE public."WalletTransactionStatus" OWNER TO postgres;

--
-- Name: WalletTransactionType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."WalletTransactionType" AS ENUM (
    'PROJECT_PAYMENT',
    'RELEASED',
    'WITHDRAWAL'
);


ALTER TYPE public."WalletTransactionType" OWNER TO postgres;

--
-- Name: WithdrawalRequestStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."WithdrawalRequestStatus" AS ENUM (
    'PENDING',
    'PROCESSING',
    'COMPLETED',
    'REJECTED',
    'SUBMITTED',
    'FAILED',
    'CANCELLED',
    'REVERSED',
    'PENDING_REVIEW',
    'APPROVED',
    'TRANSFER_INITIATED',
    'FAILED_NEEDS_MANUAL_REVIEW'
);


ALTER TYPE public."WithdrawalRequestStatus" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Ban; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Ban" (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    reason public."BanReason" NOT NULL,
    "bannedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "bannedById" integer,
    note text,
    active boolean DEFAULT true NOT NULL,
    "triggerMessage" text
);


ALTER TABLE public."Ban" OWNER TO postgres;

--
-- Name: Ban_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Ban_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Ban_id_seq" OWNER TO postgres;

--
-- Name: Ban_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Ban_id_seq" OWNED BY public."Ban".id;


--
-- Name: Bid; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Bid" (
    id integer NOT NULL,
    "projectId" integer NOT NULL,
    "engineerId" integer NOT NULL,
    price numeric(18,2) NOT NULL,
    duration text NOT NULL,
    description text NOT NULL,
    status public."BidStatus" DEFAULT 'PENDING'::public."BidStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Bid" OWNER TO postgres;

--
-- Name: Bid_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Bid_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Bid_id_seq" OWNER TO postgres;

--
-- Name: Bid_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Bid_id_seq" OWNED BY public."Bid".id;


--
-- Name: Certification; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Certification" (
    id integer NOT NULL,
    name text NOT NULL,
    "issuingOrganization" text,
    "isOfficial" boolean DEFAULT false NOT NULL
);


ALTER TABLE public."Certification" OWNER TO postgres;

--
-- Name: Certification_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Certification_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Certification_id_seq" OWNER TO postgres;

--
-- Name: Certification_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Certification_id_seq" OWNED BY public."Certification".id;


--
-- Name: Conversation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Conversation" (
    id integer NOT NULL,
    "projectId" integer,
    "clientId" integer NOT NULL,
    "engineerId" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "clientLastReadAt" timestamp(3) without time zone,
    "engineerLastReadAt" timestamp(3) without time zone,
    "invitationId" integer
);


ALTER TABLE public."Conversation" OWNER TO postgres;

--
-- Name: Conversation_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Conversation_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Conversation_id_seq" OWNER TO postgres;

--
-- Name: Conversation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Conversation_id_seq" OWNED BY public."Conversation".id;


--
-- Name: Discipline; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Discipline" (
    id integer NOT NULL,
    name text NOT NULL,
    icon text,
    "sortOrder" integer DEFAULT 0 NOT NULL
);


ALTER TABLE public."Discipline" OWNER TO postgres;

--
-- Name: Discipline_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Discipline_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Discipline_id_seq" OWNER TO postgres;

--
-- Name: Discipline_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Discipline_id_seq" OWNED BY public."Discipline".id;


--
-- Name: Dispute; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Dispute" (
    id integer NOT NULL,
    "projectId" integer NOT NULL,
    "openedById" integer NOT NULL,
    reason text NOT NULL,
    status public."DisputeStatus" DEFAULT 'OPEN'::public."DisputeStatus" NOT NULL,
    "openedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "resolvedAt" timestamp(3) without time zone,
    "resolvedById" integer,
    "resolutionNote" text
);


ALTER TABLE public."Dispute" OWNER TO postgres;

--
-- Name: Dispute_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Dispute_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Dispute_id_seq" OWNER TO postgres;

--
-- Name: Dispute_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Dispute_id_seq" OWNED BY public."Dispute".id;


--
-- Name: EngineerProfile; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."EngineerProfile" (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    specialty public."EngineerSpecialty" NOT NULL,
    bio text,
    "verificationStatus" public."VerificationStatus" DEFAULT 'PENDING'::public."VerificationStatus" NOT NULL,
    "averageRating" double precision DEFAULT 0 NOT NULL,
    "totalReviews" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "coverImageUrl" text,
    nationality text,
    "nationalId" text,
    about text,
    "acceptsConsultations" boolean DEFAULT true NOT NULL,
    "acceptsDirectMessages" boolean DEFAULT true NOT NULL,
    "acceptsInvitations" boolean DEFAULT true NOT NULL,
    "availabilityStatus" public."AvailabilityStatus",
    "coverBannerUrl" text,
    "currentCompany" text,
    "currentPosition" text,
    "expectedStartDate" timestamp(3) without time zone,
    "hourlyRateUSD" numeric(18,2),
    "linkedinUrl" text,
    "professionalHeadline" text,
    "profileCompletion" integer DEFAULT 0 NOT NULL,
    "profileVisibility" public."ProfileVisibility" DEFAULT 'PUBLIC'::public."ProfileVisibility" NOT NULL,
    slug text,
    "startingProjectPriceUSD" numeric(18,2),
    "verificationLevel" public."VerificationLevel" DEFAULT 'BASIC'::public."VerificationLevel" NOT NULL,
    "websiteUrl" text,
    "yearsOfExperience" integer
);


ALTER TABLE public."EngineerProfile" OWNER TO postgres;

--
-- Name: EngineerProfile_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."EngineerProfile_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."EngineerProfile_id_seq" OWNER TO postgres;

--
-- Name: EngineerProfile_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."EngineerProfile_id_seq" OWNED BY public."EngineerProfile".id;


--
-- Name: ExchangeRateCache; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ExchangeRateCache" (
    id text DEFAULT 'USD_EGP'::text NOT NULL,
    base text NOT NULL,
    target text NOT NULL,
    rate numeric(18,6) NOT NULL,
    provider text NOT NULL,
    "fetchedAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ExchangeRateCache" OWNER TO postgres;

--
-- Name: InvitationEvent; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."InvitationEvent" (
    id integer NOT NULL,
    "invitationId" integer NOT NULL,
    event public."InvitationEventType" NOT NULL,
    "actorId" integer,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."InvitationEvent" OWNER TO postgres;

--
-- Name: InvitationEvent_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."InvitationEvent_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."InvitationEvent_id_seq" OWNER TO postgres;

--
-- Name: InvitationEvent_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."InvitationEvent_id_seq" OWNED BY public."InvitationEvent".id;


--
-- Name: Language; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Language" (
    id integer NOT NULL,
    name text NOT NULL,
    code text
);


ALTER TABLE public."Language" OWNER TO postgres;

--
-- Name: Language_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Language_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Language_id_seq" OWNER TO postgres;

--
-- Name: Language_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Language_id_seq" OWNED BY public."Language".id;


--
-- Name: ManualPaymentSubmission; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ManualPaymentSubmission" (
    id integer NOT NULL,
    "paymentId" integer NOT NULL,
    "paymentMethod" text NOT NULL,
    "transactionReference" text NOT NULL,
    amount numeric(18,2) NOT NULL,
    currency text DEFAULT 'EGP'::text NOT NULL,
    "receiptUrl" text,
    note text,
    status public."ManualPaymentStatus" DEFAULT 'PENDING'::public."ManualPaymentStatus" NOT NULL,
    "adminNote" text,
    "verifiedBy" integer,
    "verifiedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "proofUrl" text,
    "proofOriginalName" text,
    "proofMimeType" text,
    "proofFileSize" integer,
    "receivingMethod" text,
    "receivingCountry" text,
    "receivingAccountName" text,
    "receivingBankName" text,
    "receivingAccountNumber" text,
    "receivingIban" text,
    "receivingSwift" text,
    "receivingCurrency" text,
    "receivingWalletProvider" text,
    "receivingWalletNumber" text,
    "receivingInstapayAccount" text
);


ALTER TABLE public."ManualPaymentSubmission" OWNER TO postgres;

--
-- Name: ManualPaymentSubmission_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."ManualPaymentSubmission_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ManualPaymentSubmission_id_seq" OWNER TO postgres;

--
-- Name: ManualPaymentSubmission_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."ManualPaymentSubmission_id_seq" OWNED BY public."ManualPaymentSubmission".id;


--
-- Name: Message; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Message" (
    id integer NOT NULL,
    "conversationId" integer NOT NULL,
    "senderId" integer NOT NULL,
    content text DEFAULT ''::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "attachmentUrl" text,
    "attachmentName" text,
    "attachmentMime" text
);


ALTER TABLE public."Message" OWNER TO postgres;

--
-- Name: Message_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Message_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Message_id_seq" OWNER TO postgres;

--
-- Name: Message_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Message_id_seq" OWNED BY public."Message".id;


--
-- Name: Notification; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Notification" (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    body text,
    link text,
    read boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Notification" OWNER TO postgres;

--
-- Name: Notification_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Notification_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Notification_id_seq" OWNER TO postgres;

--
-- Name: Notification_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Notification_id_seq" OWNED BY public."Notification".id;


--
-- Name: Payment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Payment" (
    id integer NOT NULL,
    "projectId" integer NOT NULL,
    "clientId" integer NOT NULL,
    "engineerId" integer NOT NULL,
    amount numeric(18,2) NOT NULL,
    commission numeric(18,2) NOT NULL,
    status public."PaymentStatus" DEFAULT 'PENDING'::public."PaymentStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "gatewayInvoiceId" text,
    "gatewayInvoiceKey" text,
    "amountEgp" numeric(18,2),
    "exchangeProvider" text,
    "exchangeRate" numeric(18,6),
    "invitationId" integer,
    "providerTimestamp" timestamp(3) without time zone,
    "rateFetchedAt" timestamp(3) without time zone,
    provider public."PaymentProvider",
    "isAdminOverride" boolean DEFAULT false NOT NULL
);


ALTER TABLE public."Payment" OWNER TO postgres;

--
-- Name: PaymentLedgerEntry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PaymentLedgerEntry" (
    id integer NOT NULL,
    "paymentId" integer NOT NULL,
    type public."PaymentLedgerType" NOT NULL,
    amount numeric(18,2) NOT NULL,
    note text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."PaymentLedgerEntry" OWNER TO postgres;

--
-- Name: PaymentLedgerEntry_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."PaymentLedgerEntry_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."PaymentLedgerEntry_id_seq" OWNER TO postgres;

--
-- Name: PaymentLedgerEntry_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."PaymentLedgerEntry_id_seq" OWNED BY public."PaymentLedgerEntry".id;


--
-- Name: Payment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Payment_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Payment_id_seq" OWNER TO postgres;

--
-- Name: Payment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Payment_id_seq" OWNED BY public."Payment".id;


--
-- Name: PayoutAuditLog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PayoutAuditLog" (
    id integer NOT NULL,
    "withdrawalId" integer NOT NULL,
    event public."PayoutAuditEvent" NOT NULL,
    "statusBefore" public."WithdrawalRequestStatus",
    "statusAfter" public."WithdrawalRequestStatus",
    message text,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "previousHash" text,
    hash text,
    "actorId" integer,
    "actorIp" text,
    "actorUserAgent" text
);


ALTER TABLE public."PayoutAuditLog" OWNER TO postgres;

--
-- Name: PayoutAuditLog_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."PayoutAuditLog_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."PayoutAuditLog_id_seq" OWNER TO postgres;

--
-- Name: PayoutAuditLog_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."PayoutAuditLog_id_seq" OWNED BY public."PayoutAuditLog".id;


--
-- Name: PlatformSettings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PlatformSettings" (
    id integer NOT NULL,
    "platformFeePercent" numeric(18,2) DEFAULT 10.0 NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "manualPaymentSettings" jsonb
);


ALTER TABLE public."PlatformSettings" OWNER TO postgres;

--
-- Name: PlatformSettings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."PlatformSettings_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."PlatformSettings_id_seq" OWNER TO postgres;

--
-- Name: PlatformSettings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."PlatformSettings_id_seq" OWNED BY public."PlatformSettings".id;


--
-- Name: PortfolioFile; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PortfolioFile" (
    id integer NOT NULL,
    "portfolioProjectId" integer NOT NULL,
    "fileUrl" text NOT NULL,
    "fileType" public."PortfolioFileType" DEFAULT 'IMAGE'::public."PortfolioFileType" NOT NULL,
    title text,
    "sortOrder" integer DEFAULT 0 NOT NULL
);


ALTER TABLE public."PortfolioFile" OWNER TO postgres;

--
-- Name: PortfolioFile_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."PortfolioFile_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."PortfolioFile_id_seq" OWNER TO postgres;

--
-- Name: PortfolioFile_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."PortfolioFile_id_seq" OWNED BY public."PortfolioFile".id;


--
-- Name: PortfolioItem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PortfolioItem" (
    id integer NOT NULL,
    "engineerId" integer NOT NULL,
    "imageUrl" text,
    description text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "clientName" text,
    country text,
    "disciplineId" integer,
    status public."PortfolioProjectStatus" DEFAULT 'PUBLISHED'::public."PortfolioProjectStatus" NOT NULL,
    title text,
    year integer
);


ALTER TABLE public."PortfolioItem" OWNER TO postgres;

--
-- Name: PortfolioItem_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."PortfolioItem_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."PortfolioItem_id_seq" OWNER TO postgres;

--
-- Name: PortfolioItem_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."PortfolioItem_id_seq" OWNED BY public."PortfolioItem".id;


--
-- Name: PortfolioProjectSkill; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PortfolioProjectSkill" (
    "portfolioProjectId" integer NOT NULL,
    "skillId" integer NOT NULL
);


ALTER TABLE public."PortfolioProjectSkill" OWNER TO postgres;

--
-- Name: ProfileAnalytics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ProfileAnalytics" (
    "engineerId" integer NOT NULL,
    views integer DEFAULT 0 NOT NULL,
    "searchImpressions" integer DEFAULT 0 NOT NULL,
    invitations integer DEFAULT 0 NOT NULL,
    clicks integer DEFAULT 0 NOT NULL
);


ALTER TABLE public."ProfileAnalytics" OWNER TO postgres;

--
-- Name: ProfileCertification; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ProfileCertification" (
    id integer NOT NULL,
    "engineerId" integer NOT NULL,
    "certificationId" integer NOT NULL,
    year integer
);


ALTER TABLE public."ProfileCertification" OWNER TO postgres;

--
-- Name: ProfileCertification_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."ProfileCertification_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ProfileCertification_id_seq" OWNER TO postgres;

--
-- Name: ProfileCertification_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."ProfileCertification_id_seq" OWNED BY public."ProfileCertification".id;


--
-- Name: ProfileLanguage; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ProfileLanguage" (
    "engineerId" integer NOT NULL,
    "languageId" integer NOT NULL,
    proficiency text
);


ALTER TABLE public."ProfileLanguage" OWNER TO postgres;

--
-- Name: ProfileServiceArea; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ProfileServiceArea" (
    "engineerId" integer NOT NULL,
    "serviceAreaId" integer NOT NULL
);


ALTER TABLE public."ProfileServiceArea" OWNER TO postgres;

--
-- Name: ProfileSkill; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ProfileSkill" (
    "engineerId" integer NOT NULL,
    "skillId" integer NOT NULL
);


ALTER TABLE public."ProfileSkill" OWNER TO postgres;

--
-- Name: ProfileSpecialization; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ProfileSpecialization" (
    "engineerId" integer NOT NULL,
    "specializationId" integer NOT NULL
);


ALTER TABLE public."ProfileSpecialization" OWNER TO postgres;

--
-- Name: Project; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Project" (
    id integer NOT NULL,
    "clientId" integer NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    budget numeric(18,2) NOT NULL,
    "serviceType" public."ServiceType" NOT NULL,
    status public."ProjectStatus" DEFAULT 'OPEN'::public."ProjectStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isFlagged" boolean DEFAULT false NOT NULL,
    "progressNote" text,
    "progressUpdatedAt" timestamp(3) without time zone,
    "deliveredAt" timestamp(3) without time zone,
    "disputePausedAt" timestamp(3) without time zone,
    "disputeWindowClosesAt" timestamp(3) without time zone
);


ALTER TABLE public."Project" OWNER TO postgres;

--
-- Name: ProjectDeliverable; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ProjectDeliverable" (
    id integer NOT NULL,
    "submissionId" integer NOT NULL,
    type public."DeliverableType" NOT NULL,
    url text NOT NULL,
    name text,
    "mimeType" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ProjectDeliverable" OWNER TO postgres;

--
-- Name: ProjectDeliverable_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."ProjectDeliverable_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ProjectDeliverable_id_seq" OWNER TO postgres;

--
-- Name: ProjectDeliverable_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."ProjectDeliverable_id_seq" OWNED BY public."ProjectDeliverable".id;


--
-- Name: ProjectInvitation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ProjectInvitation" (
    id integer NOT NULL,
    "projectId" integer NOT NULL,
    "engineerId" integer NOT NULL,
    "clientId" integer NOT NULL,
    status public."InvitationStatus" DEFAULT 'PENDING'::public."InvitationStatus" NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ProjectInvitation" OWNER TO postgres;

--
-- Name: ProjectInvitation_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."ProjectInvitation_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ProjectInvitation_id_seq" OWNER TO postgres;

--
-- Name: ProjectInvitation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."ProjectInvitation_id_seq" OWNED BY public."ProjectInvitation".id;


--
-- Name: ProjectSubmission; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ProjectSubmission" (
    id integer NOT NULL,
    "projectId" integer NOT NULL,
    "engineerId" integer NOT NULL,
    notes text,
    "revisionNote" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ProjectSubmission" OWNER TO postgres;

--
-- Name: ProjectSubmission_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."ProjectSubmission_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ProjectSubmission_id_seq" OWNER TO postgres;

--
-- Name: ProjectSubmission_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."ProjectSubmission_id_seq" OWNED BY public."ProjectSubmission".id;


--
-- Name: Project_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Project_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Project_id_seq" OWNER TO postgres;

--
-- Name: Project_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Project_id_seq" OWNED BY public."Project".id;


--
-- Name: Review; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Review" (
    id integer NOT NULL,
    "projectId" integer NOT NULL,
    "clientId" integer NOT NULL,
    "engineerId" integer NOT NULL,
    rating integer NOT NULL,
    comment text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Review" OWNER TO postgres;

--
-- Name: Review_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Review_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Review_id_seq" OWNER TO postgres;

--
-- Name: Review_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Review_id_seq" OWNED BY public."Review".id;


--
-- Name: ServiceArea; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ServiceArea" (
    id integer NOT NULL,
    type text NOT NULL,
    name text NOT NULL
);


ALTER TABLE public."ServiceArea" OWNER TO postgres;

--
-- Name: ServiceArea_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."ServiceArea_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ServiceArea_id_seq" OWNER TO postgres;

--
-- Name: ServiceArea_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."ServiceArea_id_seq" OWNED BY public."ServiceArea".id;


--
-- Name: Skill; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Skill" (
    id integer NOT NULL,
    name text NOT NULL,
    "categoryId" integer,
    "isOfficial" boolean DEFAULT false NOT NULL,
    popularity integer DEFAULT 0 NOT NULL
);


ALTER TABLE public."Skill" OWNER TO postgres;

--
-- Name: SkillCategory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SkillCategory" (
    id integer NOT NULL,
    name text NOT NULL,
    icon text,
    "sortOrder" integer DEFAULT 0 NOT NULL
);


ALTER TABLE public."SkillCategory" OWNER TO postgres;

--
-- Name: SkillCategory_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."SkillCategory_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."SkillCategory_id_seq" OWNER TO postgres;

--
-- Name: SkillCategory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."SkillCategory_id_seq" OWNED BY public."SkillCategory".id;


--
-- Name: Skill_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Skill_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Skill_id_seq" OWNER TO postgres;

--
-- Name: Skill_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Skill_id_seq" OWNED BY public."Skill".id;


--
-- Name: Specialization; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Specialization" (
    id integer NOT NULL,
    "disciplineId" integer NOT NULL,
    name text NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL
);


ALTER TABLE public."Specialization" OWNER TO postgres;

--
-- Name: Specialization_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Specialization_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Specialization_id_seq" OWNER TO postgres;

--
-- Name: Specialization_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Specialization_id_seq" OWNED BY public."Specialization".id;


--
-- Name: SupportTicket; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SupportTicket" (
    id integer NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    subject text NOT NULL,
    message text NOT NULL,
    status public."SupportTicketStatus" DEFAULT 'OPEN'::public."SupportTicketStatus" NOT NULL,
    solution text,
    "userId" integer,
    "resolvedById" integer,
    "resolvedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."SupportTicket" OWNER TO postgres;

--
-- Name: SupportTicket_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."SupportTicket_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."SupportTicket_id_seq" OWNER TO postgres;

--
-- Name: SupportTicket_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."SupportTicket_id_seq" OWNED BY public."SupportTicket".id;


--
-- Name: SystemAuditLog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SystemAuditLog" (
    id integer NOT NULL,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "actorId" integer,
    "actorRole" text NOT NULL,
    action text NOT NULL,
    "targetType" text NOT NULL,
    "targetId" text NOT NULL,
    "beforeState" jsonb,
    "afterState" jsonb,
    "ipAddress" text,
    "userAgent" text,
    "relatedTicketId" integer
);


ALTER TABLE public."SystemAuditLog" OWNER TO postgres;

--
-- Name: SystemAuditLog_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."SystemAuditLog_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."SystemAuditLog_id_seq" OWNER TO postgres;

--
-- Name: SystemAuditLog_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."SystemAuditLog_id_seq" OWNED BY public."SystemAuditLog".id;


--
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    id integer NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    role public."Role" DEFAULT 'CLIENT'::public."Role" NOT NULL,
    "isVerified" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "avatarUrl" text,
    "notificationPrefs" jsonb,
    "googleId" text
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- Name: User_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."User_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."User_id_seq" OWNER TO postgres;

--
-- Name: User_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."User_id_seq" OWNED BY public."User".id;


--
-- Name: Wallet; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Wallet" (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "availableBalance" numeric(18,2) DEFAULT 0 NOT NULL,
    "pendingBalance" numeric(18,2) DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    "heldByDispute" numeric(18,2) DEFAULT 0 NOT NULL
);


ALTER TABLE public."Wallet" OWNER TO postgres;

--
-- Name: WalletTransaction; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."WalletTransaction" (
    id integer NOT NULL,
    "walletId" integer NOT NULL,
    amount numeric(18,2) NOT NULL,
    type public."WalletTransactionType" NOT NULL,
    status public."WalletTransactionStatus" DEFAULT 'PENDING'::public."WalletTransactionStatus" NOT NULL,
    description text,
    "availableAt" timestamp(3) without time zone,
    "relatedPaymentId" integer,
    "relatedWithdrawalId" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."WalletTransaction" OWNER TO postgres;

--
-- Name: WalletTransaction_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."WalletTransaction_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."WalletTransaction_id_seq" OWNER TO postgres;

--
-- Name: WalletTransaction_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."WalletTransaction_id_seq" OWNED BY public."WalletTransaction".id;


--
-- Name: Wallet_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Wallet_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Wallet_id_seq" OWNER TO postgres;

--
-- Name: Wallet_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Wallet_id_seq" OWNED BY public."Wallet".id;


--
-- Name: WithdrawalRequest; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."WithdrawalRequest" (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    amount numeric(18,2) NOT NULL,
    method text NOT NULL,
    "accountNumber" text NOT NULL,
    status public."WithdrawalRequestStatus" DEFAULT 'PENDING'::public."WithdrawalRequestStatus" NOT NULL,
    "adminNotes" text,
    "processedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "paymobTransactionId" text,
    "paymobDisbursementStatus" text,
    "paymobStatusDescription" text,
    "paymobClientReference" text,
    "idempotencyKey" text,
    "failureReason" text,
    "balanceHeldAt" timestamp(3) without time zone,
    "submittedAt" timestamp(3) without time zone,
    "lastInquiryAt" timestamp(3) without time zone,
    "payoutType" public."PayoutType" DEFAULT 'PAYMOB'::public."PayoutType" NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    country text,
    "bankName" text,
    "accountHolderName" text,
    "ibanEncrypted" text,
    "swiftBic" text,
    "bankAddress" text,
    "accountHolderNameEncrypted" text,
    "swiftBicEncrypted" text,
    "bankAddressEncrypted" text,
    "externalReference" text,
    "internalNotes" text,
    "rejectionReason" text,
    "approvedAt" timestamp(3) without time zone,
    "approvedById" integer,
    "completedAt" timestamp(3) without time zone,
    "completedById" integer,
    "rejectedAt" timestamp(3) without time zone,
    "rejectedById" integer,
    "reconciledAt" timestamp(3) without time zone,
    "reconciledById" integer,
    "retryCount" integer DEFAULT 0 NOT NULL,
    "proofOriginalName" text,
    "proofUrl" text
);


ALTER TABLE public."WithdrawalRequest" OWNER TO postgres;

--
-- Name: WithdrawalRequest_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."WithdrawalRequest_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."WithdrawalRequest_id_seq" OWNER TO postgres;

--
-- Name: WithdrawalRequest_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."WithdrawalRequest_id_seq" OWNED BY public."WithdrawalRequest".id;


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Name: Ban id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Ban" ALTER COLUMN id SET DEFAULT nextval('public."Ban_id_seq"'::regclass);


--
-- Name: Bid id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Bid" ALTER COLUMN id SET DEFAULT nextval('public."Bid_id_seq"'::regclass);


--
-- Name: Certification id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Certification" ALTER COLUMN id SET DEFAULT nextval('public."Certification_id_seq"'::regclass);


--
-- Name: Conversation id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Conversation" ALTER COLUMN id SET DEFAULT nextval('public."Conversation_id_seq"'::regclass);


--
-- Name: Discipline id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Discipline" ALTER COLUMN id SET DEFAULT nextval('public."Discipline_id_seq"'::regclass);


--
-- Name: Dispute id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Dispute" ALTER COLUMN id SET DEFAULT nextval('public."Dispute_id_seq"'::regclass);


--
-- Name: EngineerProfile id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."EngineerProfile" ALTER COLUMN id SET DEFAULT nextval('public."EngineerProfile_id_seq"'::regclass);


--
-- Name: InvitationEvent id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."InvitationEvent" ALTER COLUMN id SET DEFAULT nextval('public."InvitationEvent_id_seq"'::regclass);


--
-- Name: Language id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Language" ALTER COLUMN id SET DEFAULT nextval('public."Language_id_seq"'::regclass);


--
-- Name: ManualPaymentSubmission id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ManualPaymentSubmission" ALTER COLUMN id SET DEFAULT nextval('public."ManualPaymentSubmission_id_seq"'::regclass);


--
-- Name: Message id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Message" ALTER COLUMN id SET DEFAULT nextval('public."Message_id_seq"'::regclass);


--
-- Name: Notification id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Notification" ALTER COLUMN id SET DEFAULT nextval('public."Notification_id_seq"'::regclass);


--
-- Name: Payment id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Payment" ALTER COLUMN id SET DEFAULT nextval('public."Payment_id_seq"'::regclass);


--
-- Name: PaymentLedgerEntry id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PaymentLedgerEntry" ALTER COLUMN id SET DEFAULT nextval('public."PaymentLedgerEntry_id_seq"'::regclass);


--
-- Name: PayoutAuditLog id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PayoutAuditLog" ALTER COLUMN id SET DEFAULT nextval('public."PayoutAuditLog_id_seq"'::regclass);


--
-- Name: PlatformSettings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PlatformSettings" ALTER COLUMN id SET DEFAULT nextval('public."PlatformSettings_id_seq"'::regclass);


--
-- Name: PortfolioFile id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PortfolioFile" ALTER COLUMN id SET DEFAULT nextval('public."PortfolioFile_id_seq"'::regclass);


--
-- Name: PortfolioItem id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PortfolioItem" ALTER COLUMN id SET DEFAULT nextval('public."PortfolioItem_id_seq"'::regclass);


--
-- Name: ProfileCertification id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProfileCertification" ALTER COLUMN id SET DEFAULT nextval('public."ProfileCertification_id_seq"'::regclass);


--
-- Name: Project id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Project" ALTER COLUMN id SET DEFAULT nextval('public."Project_id_seq"'::regclass);


--
-- Name: ProjectDeliverable id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProjectDeliverable" ALTER COLUMN id SET DEFAULT nextval('public."ProjectDeliverable_id_seq"'::regclass);


--
-- Name: ProjectInvitation id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProjectInvitation" ALTER COLUMN id SET DEFAULT nextval('public."ProjectInvitation_id_seq"'::regclass);


--
-- Name: ProjectSubmission id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProjectSubmission" ALTER COLUMN id SET DEFAULT nextval('public."ProjectSubmission_id_seq"'::regclass);


--
-- Name: Review id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Review" ALTER COLUMN id SET DEFAULT nextval('public."Review_id_seq"'::regclass);


--
-- Name: ServiceArea id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ServiceArea" ALTER COLUMN id SET DEFAULT nextval('public."ServiceArea_id_seq"'::regclass);


--
-- Name: Skill id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Skill" ALTER COLUMN id SET DEFAULT nextval('public."Skill_id_seq"'::regclass);


--
-- Name: SkillCategory id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SkillCategory" ALTER COLUMN id SET DEFAULT nextval('public."SkillCategory_id_seq"'::regclass);


--
-- Name: Specialization id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Specialization" ALTER COLUMN id SET DEFAULT nextval('public."Specialization_id_seq"'::regclass);


--
-- Name: SupportTicket id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SupportTicket" ALTER COLUMN id SET DEFAULT nextval('public."SupportTicket_id_seq"'::regclass);


--
-- Name: SystemAuditLog id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SystemAuditLog" ALTER COLUMN id SET DEFAULT nextval('public."SystemAuditLog_id_seq"'::regclass);


--
-- Name: User id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User" ALTER COLUMN id SET DEFAULT nextval('public."User_id_seq"'::regclass);


--
-- Name: Wallet id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Wallet" ALTER COLUMN id SET DEFAULT nextval('public."Wallet_id_seq"'::regclass);


--
-- Name: WalletTransaction id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WalletTransaction" ALTER COLUMN id SET DEFAULT nextval('public."WalletTransaction_id_seq"'::regclass);


--
-- Name: WithdrawalRequest id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WithdrawalRequest" ALTER COLUMN id SET DEFAULT nextval('public."WithdrawalRequest_id_seq"'::regclass);


--
-- Data for Name: Ban; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Ban" (id, "userId", reason, "bannedAt", "expiresAt", "bannedById", note, active, "triggerMessage") FROM stdin;
1	6	CONTACT_INFO_SHARING	2026-07-16 07:36:44.698	2026-08-15 07:36:44.698	\N	\N	f	https://www.nbe.com.eg/NBE/E/#/EN/Home
\.


--
-- Data for Name: Bid; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Bid" (id, "projectId", "engineerId", price, duration, description, status, "createdAt") FROM stdin;
2	2	1	9000.00	1 week	hi mr abdallah i want to take this project	ACCEPTED	2026-07-15 17:34:21.457
3	8	1	250.00	1 week	انا قادر علي انجاز ه>ا المشروع لك بأحترافية	PENDING	2026-07-31 06:35:18.41
4	9	1	150.00	1 week	I will be happy to take your project	PENDING	2026-07-31 06:58:04.271
5	12	1	2600.00	3 weeks	I am suitable for this project	ACCEPTED	2026-08-07 11:36:05.249
6	14	1	600.00	1 week	I will be happy to take your offer	ACCEPTED	2026-08-29 08:38:22.7
7	15	1	350.00	1 week	تواصل لي خاص للتفاصيل	ACCEPTED	2026-08-30 19:31:54.185
9	17	1	500.00	1 week	عندي مهارات المطلوبة للمشروع	ACCEPTED	2026-09-05 06:08:34.721
10	9	8	100.00	2 weeks	محتاج من حضرتك حدود الارض و بعض المعلومات و نبدا فيها في اقرب وقت ممكن	PENDING	2026-09-05 21:48:57.267
11	6	8	200.00	3 weeks	محتاج من حضرتك بعض التفاصيل و نبدا في اقرب وقت	PENDING	2026-09-05 21:49:57.469
13	9	4	120.00	1 week	مهندس تصميم انشائي خبرة في الكود السعودي و الامريكي ومشاريع الخليج	PENDING	2026-09-06 11:13:25.343
14	6	4	150.00	1 week	مهندس تصميم انشائي خبرة في الكود السعودي و الامريكي ومشاريع الخليج	PENDING	2026-09-06 11:45:45.58
15	1	4	100.00	1 week	مهندس تصميم انشائي خبرة في الكود السعودي و الامريكي ومشاريع الخليج	PENDING	2026-09-06 11:46:02.865
\.


--
-- Data for Name: Certification; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Certification" (id, name, "issuingOrganization", "isOfficial") FROM stdin;
\.


--
-- Data for Name: Conversation; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Conversation" (id, "projectId", "clientId", "engineerId", "createdAt", "clientLastReadAt", "engineerLastReadAt", "invitationId") FROM stdin;
16	15	18	6	2026-08-30 19:31:54.207	2026-08-30 19:41:52.917	2026-09-04 08:30:01.332	\N
14	12	16	6	2026-08-07 11:36:05.268	2026-08-07 15:45:07.506	2026-09-04 08:30:23.636	\N
15	14	17	6	2026-08-29 08:38:22.724	2026-08-29 16:01:17.534	2026-09-04 08:30:28.952	\N
10	\N	4	13	2026-07-24 20:15:27.208	2026-07-31 08:34:35.482	2026-07-24 22:39:23.136	\N
3	2	9	6	2026-07-15 17:34:21.474	2026-07-15 18:00:36.649	2026-07-15 18:03:20.987	\N
18	17	19	6	2026-09-05 06:08:34.734	2026-09-05 06:29:24.548	2026-09-06 08:50:22.116	\N
20	1	6	20	2026-09-06 11:46:02.87	\N	2026-09-06 15:38:45.633	\N
4	6	9	6	2026-07-15 18:09:17.812	2026-08-09 09:49:44.134	2026-08-10 17:17:48.811	2
11	8	4	6	2026-07-31 06:35:18.425	2026-07-31 08:34:31.39	2026-08-10 17:17:49.715	\N
5	\N	1	6	2026-07-15 22:39:34.733	2026-07-18 19:29:52.299	2026-08-10 17:17:49.98	\N
12	9	2	6	2026-07-31 06:58:04.283	\N	2026-08-10 17:17:50.186	\N
\.


--
-- Data for Name: Discipline; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Discipline" (id, name, icon, "sortOrder") FROM stdin;
\.


--
-- Data for Name: Dispute; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Dispute" (id, "projectId", "openedById", reason, status, "openedAt", "updatedAt", "resolvedAt", "resolvedById", "resolutionNote") FROM stdin;
\.


--
-- Data for Name: EngineerProfile; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."EngineerProfile" (id, "userId", specialty, bio, "verificationStatus", "averageRating", "totalReviews", "createdAt", "coverImageUrl", nationality, "nationalId", about, "acceptsConsultations", "acceptsDirectMessages", "acceptsInvitations", "availabilityStatus", "coverBannerUrl", "currentCompany", "currentPosition", "expectedStartDate", "hourlyRateUSD", "linkedinUrl", "professionalHeadline", "profileCompletion", "profileVisibility", slug, "startingProjectPriceUSD", "verificationLevel", "websiteUrl", "yearsOfExperience") FROM stdin;
3	13	CIVIL	مهندس مدني إنشائي متخصص  (طرق وكباري)	APPROVED	0	0	2026-07-24 19:55:31.423	\N	Egyptian	\N	\N	t	t	t	\N	\N	\N	\N	\N	\N	\N	\N	0	PUBLIC	hossam-mohamed	\N	BASIC	\N	\N
12	28	ARCHITECTURAL	AutoCAD for technical documentation and 3ds Max for modeling, rendering, and visualization. Focused on clean plans, buildable details, and strong presentation.	APPROVED	0	0	2026-09-05 20:24:00.636	\N	Syrian	\N	\N	t	t	t	\N	\N	\N	\N	\N	\N	\N	\N	0	PUBLIC	\N	\N	BASIC	\N	\N
1	6	CIVIL	انا مهندس  انشائي	APPROVED	5	1	2026-07-11 06:00:48.564	https://res.cloudinary.com/bkv1llhu/image/upload/v1786382677/engineer-docs/hkpwdoht5glfkbfjjmwy.jpg	Egyptian	\N	\N	t	t	t	AVAILABLE_NOW	\N	\N	\N	\N	10.00	\N	\N	0	PUBLIC	\N	50.00	BASIC	\N	5
4	20	CIVIL	Civil Engineer specialized in Structural Design, Shop Drawings, and Quantity Takeoff. Experienced in structural analysis and design of reinforced concrete structures, preparing detailed shop drawings, and calculating quantities accurately. Proficient in AutoCAD and ETABS, with good knowledge of structural design codes and technical requirements. Detail-oriented, eager to develop my technical skills, and committed to delivering accurate and practical engineering solutions.	APPROVED	0	0	2026-09-05 11:38:20.607	\N	Egyptian	\N	\N	t	t	t	\N	\N	\N	\N	\N	\N	\N	\N	0	PUBLIC	\N	\N	BASIC	\N	\N
5	21	ARCHITECTURAL	\N	APPROVED	0	0	2026-09-05 14:45:02.998	\N	Egyptian	\N	\N	t	t	t	\N	\N	\N	\N	\N	\N	\N	\N	0	PUBLIC	\N	\N	BASIC	\N	\N
6	22	CIVIL	Structural Design Engineer	APPROVED	0	0	2026-09-05 15:16:38.204	\N	Egyptian	\N	\N	t	t	t	\N	\N	\N	\N	\N	\N	\N	\N	0	PUBLIC	\N	\N	BASIC	\N	\N
13	29	CIVIL	مهندس انشائي	APPROVED	0	0	2026-09-05 21:19:14.95	\N	Yemeni	\N	\N	t	t	t	\N	\N	\N	\N	\N	\N	\N	\N	0	PUBLIC	\N	\N	BASIC	\N	\N
14	30	CIVIL	A Civil Engineer specialized in structural design, with hands-on experience across steel and reinforced-concrete structures, high-rise buildings, industrial facilities	PENDING	0	0	2026-09-06 05:56:18.044	\N	Egyptian	\N	\N	t	t	t	\N	\N	\N	\N	\N	\N	\N	\N	0	PUBLIC	\N	\N	BASIC	\N	\N
17	33	CIVIL	We are a professional team specializing in structural shop drawings, delivering high-quality work within tight deadlines. We have extensive experience working with ASD and Revit, with a strong focus on accuracy, quality, and fast delivery.	APPROVED	0	0	2026-09-06 11:26:50.838	\N	Egyptian	\N	\N	t	t	t	\N	\N	\N	\N	\N	\N	\N	\N	0	PUBLIC	mohamed-hassan	\N	BASIC	\N	\N
8	24	ARCHITECTURAL	مهندس معماري و مصمم داخلي | ببتكر مساحات تعيش فيها وتحس بيها\n\nبشتغل على المشروع من أول فكرة لآخر قطعة أثاث — لأن المبنى من بره وداخله لازم يكونوا حكاية واحدة. بقدم تصميم معماري وداخلي متكامل، مع استخدام أحدث أدوات الذكاء الاصطناعي علشان أوفّر في الوقت وأقدّم جودة أعلى.\n\nخبرة سنين في تصميم مشاريع سكنية وتجارية، وبدرّب مهندسين على دمج الـ AI في العمارة والتصميم الداخلي. لو عندك مشروع وعايز مساحة تعبّر عنك وتشتغل بإبداع، يلا نبدأ!	APPROVED	0	0	2026-09-05 18:36:16.937	https://res.cloudinary.com/bkv1llhu/image/upload/v1788701720/images/eqbj3rwzlittmavfyn4z.jpg	Egyptian	\N	\N	t	t	t	AVAILABLE_NOW	\N	\N	\N	\N	100.00	\N	Architect & Interior Designer | AI-Powered Design Solutions	0	PUBLIC	kareem-mohammed-zaghlwl	2000.00	BASIC	\N	3
18	34	CIVIL	Responsibilities:• Prepare and review structural and construction drawings in accordance with approved designs and project specifications.\r\n• Prepare shop drawings and implement the required revisions to meet project requirements.\r\n• Perform quantity take-offs and prepare Bills of Quantities (BOQs) for construction projects.\r\n• Review structural and architectural drawings and ensure proper coordination between different disciplines.• Prepare and review technical documents, reports, and project documentation.• Perform structural design and analysis of various structural elements using engineering software such as AutoCAD, SAP2000, ETABS, SAFE, and ASD.• Prepare and review Method Statements and other technical documents related to construction activities.• Coordinate and update engineering drawings and technical documents based on project requirements and revisions.• Coordinate with engineers, contractors, and consultants to resolve technical issues and clarify construction requirements.• Review construction activities when required and ensure compliance with approved drawings and technical specifications.• Prepare progress reports, quantity take-offs, and payment-related documents.• Provide technical support and engineering consultancy for various construction projects according to client and project requirements.Project:• Residential and Commercial High-Rise Tower Project in the United Arab Emirates, consisting of 3 basement levels and 30 typical floors.	APPROVED	0	0	2026-09-06 20:25:37.016	\N	Egyptian	\N	\N	t	t	t	\N	\N	\N	\N	\N	\N	\N	\N	0	PUBLIC	\N	\N	BASIC	\N	\N
19	35	ARCHITECTURAL	( Interior Designer )  \n\n\nI hope you are doing well. \n\nI came across your job posting and would like to apply for the (Interior Designer ) I am an Interior Designer with strong skills in 3D visualization, design development, and project coordination. I am passionate about creating functional and aesthetic spaces, and I’m eager to contribute my skills to your team.\n\nPlease find my CV attached for your review. I would be happy to discuss how my qualifications align with your company’s needs. \n\n Thank you for considering my application. I look forward to your response.\n\n Best regards, \n[ Mohamed Hares ]\n  \n📞 [ 02-01141579005 ]\n📧 [ hares99m@gmail.com ] \n\n🔗 [LinkedIn Profile ] – https://www.linkedin.com/in/mohamed-haress-973387377/\n🎨 [ Behance Profile ] –  https://www.behance.net/mohamedhares99	PENDING	0	0	2026-09-06 21:00:56.331	\N	Egyptian	\N	\N	t	t	t	\N	\N	\N	\N	\N	\N	\N	\N	0	PUBLIC	\N	\N	BASIC	\N	\N
20	36	ARCHITECTURAL	I’m interior designer	PENDING	0	0	2026-09-06 21:23:17.239	\N	Egyptian	\N	\N	t	t	t	\N	\N	\N	\N	\N	\N	\N	\N	0	PUBLIC	\N	\N	BASIC	\N	\N
21	37	ARCHITECTURAL	مهندس معماري خريج، ولدي خبرة في إعداد وتطوير المخططات المعمارية والمشاريع ، بالإضافة إلى التعامل مع برامج AutoCAD وRevit.\n\n\nتحياتي لكم.\nعبدالرحمن ماتع\nمهندس معماري	PENDING	0	0	2026-09-06 22:45:31.262	\N	Yemeni	\N	\N	t	t	t	\N	\N	\N	\N	\N	\N	\N	\N	0	PUBLIC	\N	\N	BASIC	\N	\N
22	38	ARCHITECTURAL	Junior Architect with a strong interest in architectural design, technical drawings, and BIM. Constantly seeking to improve my skills and expand my professional knowledge. Eager to join a creative team where I can grow, contribute, and work on impactful projects.	PENDING	0	0	2026-09-07 06:33:46.418	\N	Egyptian	\N	\N	t	t	t	\N	\N	\N	\N	\N	\N	\N	\N	0	PUBLIC	\N	\N	BASIC	\N	\N
\.


--
-- Data for Name: ExchangeRateCache; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ExchangeRateCache" (id, base, target, rate, provider, "fetchedAt", "createdAt", "updatedAt") FROM stdin;
USD_EGP	USD	EGP	50.943520	OpenExchangeRate (open.er-api.com)	2026-09-06 00:02:31	2026-07-15 12:40:41.821	2026-09-07 00:00:00.056
\.


--
-- Data for Name: InvitationEvent; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."InvitationEvent" (id, "invitationId", event, "actorId", metadata, "createdAt") FROM stdin;
4	2	SENT	9	\N	2026-07-15 18:08:39.889
5	2	VIEWED	6	{"ip": "217.53.118.53", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36"}	2026-07-15 18:09:06.959
6	2	ACCEPTED	6	{"ip": "217.53.118.53", "source": "web", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36"}	2026-07-15 18:09:17.802
7	2	CANCELLED	\N	{"reason": "Payment timeout"}	2026-07-23 03:35:38.858
\.


--
-- Data for Name: Language; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Language" (id, name, code) FROM stdin;
\.


--
-- Data for Name: ManualPaymentSubmission; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ManualPaymentSubmission" (id, "paymentId", "paymentMethod", "transactionReference", amount, currency, "receiptUrl", note, status, "adminNote", "verifiedBy", "verifiedAt", "createdAt", "updatedAt", "proofUrl", "proofOriginalName", "proofMimeType", "proofFileSize", "receivingMethod", "receivingCountry", "receivingAccountName", "receivingBankName", "receivingAccountNumber", "receivingIban", "receivingSwift", "receivingCurrency", "receivingWalletProvider", "receivingWalletNumber", "receivingInstapayAccount") FROM stdin;
1	6	instapay	566777555	350.00	USD	/uploads/documents/98f53adc-77ed-46a9-a1e6-20f11fe12525.png	\N	VERIFIED		8	2026-08-30 19:39:35.044	2026-08-30 19:38:46.793	2026-08-30 19:39:35.046	/uploads/documents/98f53adc-77ed-46a9-a1e6-20f11fe12525.png	IMG_1531.png	image/png	551158	instapay	\N	ahmed abdalkader	\N	\N	\N	\N	\N	\N	\N	ahmedabdalkader588
2	8	instapay	535444364356	500.00	USD	/uploads/documents/8852d8b2-4211-4316-ae7f-0e7df7174f87.png	\N	VERIFIED		8	2026-09-05 06:20:11.719	2026-09-05 06:18:27.784	2026-09-05 06:20:11.73	/uploads/documents/8852d8b2-4211-4316-ae7f-0e7df7174f87.png	IMG_1586.png	image/png	432437	instapay	\N	ahmed abdalkader	\N	\N	\N	\N	\N	\N	\N	ahmedabdalkader588
\.


--
-- Data for Name: Message; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Message" (id, "conversationId", "senderId", content, "createdAt", "attachmentUrl", "attachmentName", "attachmentMime") FROM stdin;
2	3	6	hi mr abdallah	2026-07-15 17:35:56.088	\N	\N	\N
3	3	9	Hi	2026-07-15 17:43:04.07	\N	\N	\N
4	3	6	hi	2026-07-15 17:51:04.721	\N	\N	\N
5	4	9	Hi	2026-07-15 22:02:36.856	\N	\N	\N
6	4	6	Hello	2026-07-15 22:04:46.931	\N	\N	\N
7	5	1	Hello	2026-07-15 22:39:44.072	\N	\N	\N
8	5	6	Hi engineer	2026-07-15 22:49:37.09	\N	\N	\N
9	5	1	Another one please	2026-07-15 22:51:19.58	\N	\N	\N
10	5	6	How are you	2026-07-15 22:52:18.874	\N	\N	\N
20	4	6	ازيك ايه اخبار الشغل	2026-07-18 19:38:19.417	\N	\N	\N
21	4	9	👌👌	2026-07-21 10:33:18.585	\N	\N	\N
22	10	4	hi hossam	2026-07-24 20:15:35.821	\N	\N	\N
23	10	4	كيف حالك	2026-07-24 20:16:02.923	\N	\N	\N
24	10	13	بخير الحمدلله	2026-07-24 22:39:35.925	\N	\N	\N
25	14	16	السلام عليكم	2026-08-07 15:20:36.517	\N	\N	\N
26	14	16	كيف حالك مهندس	2026-08-07 15:20:42.316	\N	\N	\N
27	14	6	اهلا وسهلا كيف حالك اخي	2026-08-07 15:22:24.082	\N	\N	\N
28	15	6	السلام عليكم	2026-08-29 08:39:52.952	\N	\N	\N
29	15	6	كيف حالك اخي	2026-08-29 08:40:00.094	\N	\N	\N
30	16	18	Hi	2026-08-30 19:40:09.075	\N	\N	\N
31	20	20	السلام عليكم	2026-09-06 11:54:34.358	\N	\N	\N
32	20	20	حضرتك محتاج مهندس تصميم انشائي للمشروع ؟	2026-09-06 11:55:07.158	\N	\N	\N
\.


--
-- Data for Name: Notification; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Notification" (id, "userId", type, title, body, link, read, "createdAt") FROM stdin;
1	6	ENGINEER_APPLICATION_RECEIVED	Engineer application received	We are reviewing your documents and portfolio. We will notify you when you are accepted.	/settings	t	2026-07-11 06:00:48.578
2	6	ENGINEER_APPLICATION_APPROVED	You are now an engineer	Your application was approved. You can browse projects and submit bids.	/projects	t	2026-07-11 21:01:40.443
5	1	NEW_BID	New bid received	Medo Alashkam placed a bid on "Test for bid"	/projects?project=4	t	2026-07-15 12:07:01.7
10	1	PAYMENT_RECEIVED	Payment successful	Your payment for "Test for bid" is secured in escrow.	/escrow?project=4	t	2026-07-15 12:41:48.032
23	9	NEW_MESSAGE	New message	hi mr abdallah	/messages?project=2	t	2026-07-15 17:35:56.104
22	6	BID_ACCEPTED	Bid accepted	Your bid on "Egypt" was accepted. The client will pay to start — you'll get a message when payment is received.	/messages?project=2	t	2026-07-15 17:34:47.447
24	6	NEW_MESSAGE	New message	Hi	/messages?project=2	f	2026-07-15 17:43:04.076
25	6	ACCOUNT_BANNED	Account suspended	You have been suspended for 30 days for sharing contact information outside the platform.	\N	f	2026-07-15 17:44:32.8
21	9	NEW_BID	New bid received	ahmed abdalkader placed a bid on "Egypt"	/projects?project=2	t	2026-07-15 17:34:21.462
4	8	ENGINEER_APPLICATION_RECEIVED	New Engineer Application	A new engineer has submitted their application and is pending review.	/admin/verification	t	2026-07-15 12:04:01.461
27	9	NEW_MESSAGE	New message	hi	/messages?project=2	f	2026-07-15 17:51:04.726
26	6	ACCOUNT_BANNED	Account restored	Your account suspension has been lifted.	\N	t	2026-07-15 17:50:18.241
28	6	PROJECT_INVITATION	New Project Invitation	Abdo Gaber invited you to work on "Villa duplex".	/invitations	t	2026-07-15 18:08:39.894
29	9	INVITATION_ACCEPTED	Invitation Accepted	ahmed abdalkader accepted your invitation for "Villa duplex". Please proceed to payment.	/projects?id=6	f	2026-07-15 18:09:17.817
30	6	NEW_MESSAGE	New message	Hi	/messages?project=6	f	2026-07-15 22:02:36.867
31	9	NEW_MESSAGE	New message	Hello	/messages?project=6	f	2026-07-15 22:04:46.94
32	6	NEW_MESSAGE	New message	Hello	/messages?user=1	f	2026-07-15 22:39:44.081
34	6	NEW_MESSAGE	New message	Another one please	/messages?user=1	f	2026-07-15 22:51:19.586
36	6	ACCOUNT_BANNED	Account suspended	You have been suspended for 30 days for sharing contact information outside the platform.	\N	f	2026-07-16 07:36:44.709
12	1	INVITATION_ACCEPTED	Invitation Accepted	Medo Alashkam accepted your invitation for "Test for hiring". Please proceed to payment.	/projects?id=5	t	2026-07-15 12:44:25.72
15	1	PAYMENT_RECEIVED	Payment successful	Your payment for "Test for hiring" is secured in escrow.	/escrow?project=5	t	2026-07-15 12:45:04.029
16	1	WORK_SUBMITTED	Work ready for review	The engineer submitted deliverables for "Test for bid". Review and approve or request revisions.	/messages?project=4	t	2026-07-15 12:53:31.714
17	1	PROJECT_COMPLETED	Project completed	You approved work on "Test for bid". Payment has been released.	/projects?id=4	t	2026-07-15 12:54:16.726
33	1	NEW_MESSAGE	New message	Hi engineer	/messages?user=6	t	2026-07-15 22:49:37.098
35	1	NEW_MESSAGE	New message	How are you	/messages?user=6	t	2026-07-15 22:52:18.881
43	6	NEW_MESSAGE	New message	التعديلات تمام يبشمهندس كدا الرسايل شغالة والصور ظهرت	/messages?user=12	f	2026-07-18 15:37:41.212
44	6	NEW_MESSAGE	New message	قلت ابعتلك هنا علشان نجربها	/messages?user=12	f	2026-07-18 15:38:47.591
47	9	NEW_MESSAGE	New message	ازيك ايه اخبار الشغل	/messages?project=6	f	2026-07-18 19:38:19.429
45	6	ACCOUNT_BANNED	Account restored	Your account suspension has been lifted.	\N	t	2026-07-18 19:25:58.92
48	6	NEW_MESSAGE	New message	👌👌	/messages?project=6	f	2026-07-21 10:33:18.596
49	9	INVITATION_CANCELLED	Invitation Cancelled (Payment Timeout)	The accepted invitation for "Villa duplex" was cancelled because payment was not completed within 7 days. The project is now open again.	/projects?id=6	f	2026-07-23 03:35:38.868
50	6	INVITATION_CANCELLED	Invitation Cancelled	The accepted invitation for "Villa duplex" was cancelled because the client did not complete payment in time.	/invitations	f	2026-07-23 03:35:38.875
51	13	ENGINEER_APPLICATION_RECEIVED	Engineer application received	We are reviewing your documents and portfolio. We will notify you when you are accepted.	/settings	f	2026-07-24 19:55:31.653
52	8	ENGINEER_APPLICATION_RECEIVED	New Engineer Application	A new engineer has submitted their application and is pending review.	/admin/verification	t	2026-07-24 19:55:31.663
53	13	ENGINEER_APPLICATION_APPROVED	Verification approved	Your engineer credentials have been approved.	/dashboard	f	2026-07-24 20:04:40.238
54	13	NEW_MESSAGE	New message	hi hossam	/messages?user=4	f	2026-07-24 20:15:35.825
55	13	NEW_MESSAGE	New message	كيف حالك	/messages?user=4	f	2026-07-24 20:16:02.929
56	4	NEW_MESSAGE	New message	بخير الحمدلله	/messages?user=13	f	2026-07-24 22:39:35.931
58	2	NEW_BID	New bid received	ahmed abdalkader placed a bid on "مشروع فيلا سكنية"	/projects?project=9	f	2026-07-31 06:58:04.276
57	4	NEW_BID	New bid received	ahmed abdalkader placed a bid on "A factory made of steel"	/projects?project=8	t	2026-07-31 06:35:18.415
59	6	NEW_PROJECT_POSTED	New Project Posted	A new project "Notification test" was just posted. Submit your bid now!	/projects/11	f	2026-08-05 14:18:36.079
61	13	NEW_PROJECT_POSTED	New Project Posted	A new project "Notification test" was just posted. Submit your bid now!	/projects/11	f	2026-08-05 14:18:36.096
62	6	NEW_PROJECT_POSTED	New Project Posted	A new project "مشروع محطة قطار السريع" was just posted. Submit your bid now!	/projects/12	f	2026-08-07 09:57:16.121
64	13	NEW_PROJECT_POSTED	New Project Posted	A new project "مشروع محطة قطار السريع" was just posted. Submit your bid now!	/projects/12	f	2026-08-07 09:57:16.138
66	6	NEW_PROJECT_POSTED	New Project Posted	A new project "Notification test" was just posted. Submit your bid now!	/projects?id=13	f	2026-08-07 12:36:32.365
68	13	NEW_PROJECT_POSTED	New Project Posted	A new project "Notification test" was just posted. Submit your bid now!	/projects?id=13	f	2026-08-07 12:36:32.394
65	16	NEW_BID	New bid received	ahmed abdalkader placed a bid on "مشروع محطة قطار السريع"	/projects?project=12	t	2026-08-07 11:36:05.254
69	6	BID_ACCEPTED	Bid accepted	Your bid on "مشروع محطة قطار السريع" was accepted. The client will pay to start — you'll get a message when payment is received.	/messages?project=12	f	2026-08-07 15:20:11.794
70	6	NEW_MESSAGE	New message	السلام عليكم	/messages?project=12	f	2026-08-07 15:20:36.528
72	16	NEW_MESSAGE	New message	اهلا وسهلا كيف حالك اخي	/messages?project=12	t	2026-08-07 15:22:24.093
71	6	NEW_MESSAGE	New message	كيف حالك مهندس	/messages?project=12	t	2026-08-07 15:20:42.325
74	13	NEW_PROJECT_POSTED	New Project Posted	A new project "عمارة سكنية" was just posted. Submit your bid now!	/projects?id=14	f	2026-08-29 08:32:27.79
75	6	NEW_PROJECT_POSTED	New Project Posted	A new project "عمارة سكنية" was just posted. Submit your bid now!	/projects?id=14	f	2026-08-29 08:32:27.797
76	17	NEW_BID	New bid received	ahmed abdalkader placed a bid on "عمارة سكنية"	/projects?project=14	f	2026-08-29 08:38:22.705
77	6	BID_ACCEPTED	Bid accepted	Your bid on "عمارة سكنية" was accepted. The client will pay to start — you'll get a message when payment is received.	/messages?project=14	f	2026-08-29 08:39:24.723
78	17	NEW_MESSAGE	New message	السلام عليكم	/messages?project=14	f	2026-08-29 08:39:52.965
79	17	NEW_MESSAGE	New message	كيف حالك اخي	/messages?project=14	t	2026-08-29 08:40:00.105
81	13	NEW_PROJECT_POSTED	New Project Posted	A new project "Restaurant at cairo" was just posted. Submit your bid now!	/projects?id=15	f	2026-08-30 19:30:39.152
82	6	NEW_PROJECT_POSTED	New Project Posted	A new project "Restaurant at cairo" was just posted. Submit your bid now!	/projects?id=15	f	2026-08-30 19:30:39.16
83	18	NEW_BID	New bid received	ahmed abdalkader placed a bid on "Restaurant at cairo"	/projects?project=15	f	2026-08-30 19:31:54.192
84	6	BID_ACCEPTED	Bid accepted	Your bid on "Restaurant at cairo" was accepted. The client will pay to start — you'll get a message when payment is received.	/messages?project=15	f	2026-08-30 19:32:38.687
85	18	PAYMENT_RECEIVED	Payment Verified	Your manual payment for "Restaurant at cairo" has been verified. The project escrow is now funded.	/projects?id=15	f	2026-08-30 19:39:35.08
87	6	NEW_MESSAGE	New message	Hi	/messages?project=15	f	2026-08-30 19:40:09.086
86	6	ESCROW_FUNDED	Escrow Funded	Escrow for "Restaurant at cairo" has been funded. You can now start working.	/projects?id=15	t	2026-08-30 19:39:35.089
88	18	WORK_SUBMITTED	Work ready for review	The engineer submitted deliverables for "Restaurant at cairo". Review and approve or request revisions.	/messages?project=15	f	2026-08-30 19:41:20.034
89	18	PROJECT_COMPLETED	Project completed	You approved work on "Restaurant at cairo". Payment has been released.	/projects?id=15	f	2026-08-30 19:42:44.162
90	6	WORK_APPROVED	Work approved	The client approved your work on "Restaurant at cairo". Earnings are now pending in your wallet.	/balance	f	2026-08-30 19:42:44.171
91	6	FUNDS_RELEASED	Payment queued to wallet	Payment for "Restaurant at cairo" will become available after the 14-day holding period.	/balance	t	2026-08-30 19:42:44.177
93	13	NEW_PROJECT_POSTED	New Project Posted	A new project "Payment" was just posted. Submit your bid now!	/projects?id=16	f	2026-09-05 04:14:50.106
94	6	NEW_PROJECT_POSTED	New Project Posted	A new project "Payment" was just posted. Submit your bid now!	/projects?id=16	f	2026-09-05 04:14:50.111
95	1	NEW_BID	New bid received	Mohamed Talal placed a bid on "Payment"	/projects?project=16	f	2026-09-05 04:15:14.692
98	13	NEW_PROJECT_POSTED	New Project Posted	A new project "مشروع فيلا مكونة من اربع ادوار وبها روف" was just posted. Submit your bid now!	/projects?id=17	f	2026-09-05 04:23:46.874
99	6	NEW_PROJECT_POSTED	New Project Posted	A new project "مشروع فيلا مكونة من اربع ادوار وبها روف" was just posted. Submit your bid now!	/projects?id=17	f	2026-09-05 04:23:46.879
100	19	NEW_BID	New bid received	ahmed abdalkader placed a bid on "مشروع فيلا مكونة من اربع ادوار وبها روف"	/projects?project=17	f	2026-09-05 06:08:34.726
101	6	BID_ACCEPTED	Bid accepted	Your bid on "مشروع فيلا مكونة من اربع ادوار وبها روف" was accepted. The client will pay to start — you'll get a message when payment is received.	/messages?project=17	f	2026-09-05 06:14:38.247
102	19	PAYMENT_RECEIVED	Payment Verified	Your manual payment for "مشروع فيلا مكونة من اربع ادوار وبها روف" has been verified. The project escrow is now funded.	/projects?id=17	f	2026-09-05 06:20:11.785
103	6	ESCROW_FUNDED	Escrow Funded	Escrow for "مشروع فيلا مكونة من اربع ادوار وبها روف" has been funded. You can now start working.	/projects?id=17	f	2026-09-05 06:20:11.794
104	19	WORK_SUBMITTED	Work ready for review	The engineer submitted deliverables for "مشروع فيلا مكونة من اربع ادوار وبها روف". The review window has started/resumed.	/client/projects/17	t	2026-09-05 06:22:34.078
105	19	PROJECT_COMPLETED	Project completed	You approved work on "مشروع فيلا مكونة من اربع ادوار وبها روف". Payment has been released.	/projects?id=17	f	2026-09-05 06:30:37.322
106	6	WORK_APPROVED	Work approved	The client approved your work on "مشروع فيلا مكونة من اربع ادوار وبها روف". Earnings are now pending in your wallet.	/balance	f	2026-09-05 06:30:37.333
107	6	FUNDS_RELEASED	Payment queued to wallet	Payment for "مشروع فيلا مكونة من اربع ادوار وبها روف" will become available after the 14-day holding period.	/balance	f	2026-09-05 06:30:37.339
109	21	ENGINEER_APPLICATION_APPROVED	Verification approved	Your engineer credentials have been approved.	/dashboard	f	2026-09-05 16:34:16.716
111	8	ENGINEER_APPLICATION_RECEIVED	New Engineer Application	A new engineer has submitted their application and is pending review.	/admin/verification	t	2026-09-05 17:33:07.662
113	22	ENGINEER_APPLICATION_APPROVED	Verification approved	Your engineer credentials have been approved.	/dashboard	f	2026-09-05 18:20:06.735
114	24	ENGINEER_APPLICATION_RECEIVED	Engineer application received	We are reviewing your documents and portfolio. We will notify you when you are accepted.	/settings	f	2026-09-05 18:36:17.155
115	8	ENGINEER_APPLICATION_RECEIVED	New Engineer Application	A new engineer has submitted their application and is pending review.	/admin/verification	t	2026-09-05 18:36:17.164
118	11	ENGINEER_APPLICATION_RECEIVED	New Engineer Application	A new engineer has submitted their application and is pending review.	/admin/verification	f	2026-09-05 18:44:29.316
119	8	ENGINEER_APPLICATION_RECEIVED	New Engineer Application	A new engineer has submitted their application and is pending review.	/admin/verification	t	2026-09-05 18:44:29.321
122	11	ENGINEER_APPLICATION_RECEIVED	New Engineer Application	A new engineer has submitted their application and is pending review.	/admin/verification	f	2026-09-05 18:56:35.336
123	8	ENGINEER_APPLICATION_RECEIVED	New Engineer Application	A new engineer has submitted their application and is pending review.	/admin/verification	t	2026-09-05 18:56:35.345
125	11	ENGINEER_APPLICATION_RECEIVED	New Engineer Application	A new engineer has submitted their application and is pending review.	/admin/verification	f	2026-09-05 19:35:48.38
127	2	NEW_BID	New bid received	kareem mohammed zaghlwl placed a bid on "مشروع فيلا سكنية"	/projects?project=9	f	2026-09-05 21:48:57.274
128	9	NEW_BID	New bid received	kareem mohammed zaghlwl placed a bid on "Villa duplex"	/projects?project=6	f	2026-09-05 21:49:57.473
116	24	ENGINEER_APPLICATION_APPROVED	Verification approved	Your engineer credentials have been approved.	/dashboard	t	2026-09-05 18:42:00.23
126	8	ENGINEER_APPLICATION_RECEIVED	New Engineer Application	A new engineer has submitted their application and is pending review.	/admin/verification	t	2026-09-05 19:35:48.386
129	28	ENGINEER_APPLICATION_APPROVED	Verification approved	Your engineer credentials have been approved.	/dashboard	f	2026-09-06 04:46:35.144
130	29	ENGINEER_APPLICATION_APPROVED	Verification approved	Your engineer credentials have been approved.	/dashboard	f	2026-09-06 04:46:36.825
132	21	NEW_PROJECT_POSTED	New Project Posted	A new project "Test" was just posted. Submit your bid now!	/projects?id=18	f	2026-09-06 05:57:41.204
134	22	NEW_PROJECT_POSTED	New Project Posted	A new project "Test" was just posted. Submit your bid now!	/projects?id=18	f	2026-09-06 05:57:41.211
131	20	NEW_PROJECT_POSTED	New Project Posted	A new project "Test" was just posted. Submit your bid now!	/projects?id=18	t	2026-09-06 05:57:41.199
108	20	ENGINEER_APPLICATION_APPROVED	Verification approved	Your engineer credentials have been approved.	/dashboard	t	2026-09-05 16:33:22.7
136	28	NEW_PROJECT_POSTED	New Project Posted	A new project "Test" was just posted. Submit your bid now!	/projects?id=18	f	2026-09-06 05:57:41.222
137	13	NEW_PROJECT_POSTED	New Project Posted	A new project "Test" was just posted. Submit your bid now!	/projects?id=18	f	2026-09-06 05:57:41.229
141	29	NEW_PROJECT_POSTED	New Project Posted	A new project "Test" was just posted. Submit your bid now!	/projects?id=18	f	2026-09-06 05:57:41.259
142	1	NEW_BID	New bid received	Mohamed Talal placed a bid on "Test"	/projects?project=18	f	2026-09-06 05:58:18.548
144	1	PAYMENT_RECEIVED	Payment Verified	Your manual payment for "Test" has been verified. The project escrow is now funded.	/projects?id=18	f	2026-09-06 05:59:58.722
146	1	WORK_SUBMITTED	Work ready for review	The engineer submitted deliverables for "Test". The review window has started/resumed.	/client/projects/18	f	2026-09-06 06:01:37.072
147	1	PROJECT_COMPLETED	Project completed	You approved work on "Test". Payment has been released.	/projects?id=18	f	2026-09-06 06:02:37.929
140	6	NEW_PROJECT_POSTED	New Project Posted	A new project "Test" was just posted. Submit your bid now!	/projects?id=18	t	2026-09-06 05:57:41.252
150	2	NEW_BID	New bid received	Omar placed a bid on "مشروع فيلا سكنية"	/projects?project=9	f	2026-09-06 11:13:25.347
151	33	ENGINEER_APPLICATION_RECEIVED	Engineer application received	We are reviewing your documents and portfolio. We will notify you when you are accepted.	/settings	f	2026-09-06 11:26:51.096
152	11	ENGINEER_APPLICATION_RECEIVED	New Engineer Application	A new engineer has submitted their application and is pending review.	/admin/verification	f	2026-09-06 11:26:51.104
154	33	ENGINEER_APPLICATION_APPROVED	Verification approved	Your engineer credentials have been approved.	/dashboard	f	2026-09-06 11:39:20.52
153	8	ENGINEER_APPLICATION_RECEIVED	New Engineer Application	A new engineer has submitted their application and is pending review.	/admin/verification	t	2026-09-06 11:26:51.109
157	9	NEW_BID	New bid received	Omar placed a bid on "Villa duplex"	/projects?project=6	f	2026-09-06 11:45:45.585
158	6	NEW_MESSAGE	New message	السلام عليكم	/messages?project=1	f	2026-09-06 11:54:34.367
159	6	NEW_MESSAGE	New message	حضرتك محتاج مهندس تصميم انشائي للمشروع ؟	/messages?project=1	f	2026-09-06 11:55:07.165
138	24	NEW_PROJECT_POSTED	New Project Posted	A new project "Test" was just posted. Submit your bid now!	/projects?id=18	t	2026-09-06 05:57:41.241
160	34	ENGINEER_APPLICATION_RECEIVED	Engineer application received	We are reviewing your documents and portfolio. We will notify you when you are accepted.	/settings	f	2026-09-06 20:30:17.605
161	11	ENGINEER_APPLICATION_RECEIVED	New Engineer Application	A new engineer has submitted their application and is pending review.	/admin/verification	f	2026-09-06 20:30:17.62
162	8	ENGINEER_APPLICATION_RECEIVED	New Engineer Application	A new engineer has submitted their application and is pending review.	/admin/verification	f	2026-09-06 20:30:17.628
163	34	ENGINEER_APPLICATION_APPROVED	Verification approved	Your engineer credentials have been approved.	/dashboard	f	2026-09-06 20:31:06.768
\.


--
-- Data for Name: Payment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Payment" (id, "projectId", "clientId", "engineerId", amount, commission, status, "createdAt", "updatedAt", "gatewayInvoiceId", "gatewayInvoiceKey", "amountEgp", "exchangeProvider", "exchangeRate", "invitationId", "providerTimestamp", "rateFetchedAt", provider, "isAdminOverride") FROM stdin;
6	15	18	1	350.00	35.00	RELEASED	2026-08-30 19:32:53.579	2026-08-30 19:42:44.144	\N	\N	17587.85	OpenExchangeRate (open.er-api.com)	50.250989	\N	2026-08-30 00:02:31	2026-08-30 19:37:48.596	MANUAL	f
3	2	9	1	9000.00	900.00	PENDING	2026-07-15 17:37:42.276	2026-07-15 17:56:25.911	egy_csk_test_7b5934748c78cd83a5ac527f4c821708	egy_csk_test_7b5934748c78cd83a5ac527f4c821708	456512.70	OpenExchangeRate (open.er-api.com)	50.723633	\N	2026-07-15 00:02:32	2026-07-15 17:56:25.292	\N	f
4	12	16	1	2600.00	260.00	PENDING	2026-08-07 15:21:33.014	2026-08-07 22:01:12.494	egy_csk_test_df216e672d2a251afea6199c368d0f2f	egy_csk_test_df216e672d2a251afea6199c368d0f2f	129451.12	OpenExchangeRate (open.er-api.com)	49.788892	\N	2026-08-07 00:02:31	2026-08-07 22:01:11.799	\N	f
8	17	19	1	500.00	50.00	RELEASED	2026-09-05 06:15:05.576	2026-09-05 06:30:37.286	\N	\N	25472.12	OpenExchangeRate (open.er-api.com)	50.944245	\N	2026-09-05 00:02:32	2026-09-05 06:17:18.65	MANUAL	f
5	14	17	1	600.00	60.00	PENDING	2026-08-29 08:40:48.459	2026-08-29 09:05:11.554	egy_csk_test_a551d51a0f9d588e4a639975a5d70bf7	egy_csk_test_a551d51a0f9d588e4a639975a5d70bf7	30151.57	OpenExchangeRate (open.er-api.com)	50.252612	\N	2026-08-29 00:02:31	2026-08-29 09:05:10.934	\N	f
\.


--
-- Data for Name: PaymentLedgerEntry; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PaymentLedgerEntry" (id, "paymentId", type, amount, note, "createdAt") FROM stdin;
9	6	FUNDED	350.00	Client escrow payment received via manual payment	2026-08-30 19:39:35.073
10	6	ENGINEER_ESCROW	315.00	Engineer share held in escrow	2026-08-30 19:39:35.073
11	6	PLATFORM_COMMISSION	35.00	Platform commission on funded payment	2026-08-30 19:39:35.073
12	6	RELEASED	315.00	Client approved work — engineer earnings released	2026-08-30 19:42:44.148
13	6	PLATFORM_COMMISSION	35.00	Platform commission retained	2026-08-30 19:42:44.148
14	8	FUNDED	500.00	Client escrow payment received via manual payment	2026-09-05 06:20:11.776
15	8	ENGINEER_ESCROW	450.00	Engineer share held in escrow	2026-09-05 06:20:11.776
16	8	PLATFORM_COMMISSION	50.00	Platform commission on funded payment	2026-09-05 06:20:11.776
17	8	RELEASED	450.00	Client approved work — engineer earnings released	2026-09-05 06:30:37.294
18	8	PLATFORM_COMMISSION	50.00	Platform commission retained	2026-09-05 06:30:37.294
\.


--
-- Data for Name: PayoutAuditLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PayoutAuditLog" (id, "withdrawalId", event, "statusBefore", "statusAfter", message, metadata, "createdAt", "previousHash", hash, "actorId", "actorIp", "actorUserAgent") FROM stdin;
\.


--
-- Data for Name: PlatformSettings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PlatformSettings" (id, "platformFeePercent", "updatedAt", "manualPaymentSettings") FROM stdin;
1	10.00	2026-09-03 13:42:47.153	{"instapay": {"enabled": true}, "bankAccounts": [{"id": "acc-1788118459713-tm65", "iban": "SA88 8000 0105 6080 1041 0029", "swift": "", "country": "SA", "enabled": true, "bankName": "SAUDI NATIONAL BANK", "currency": "SAR", "accountHolder": "ABDALKADER TWFEIK", "accountNumber": "105000010006080410029"}, {"id": "acc-1788420858748-u1j1", "iban": "EG930003052850010476805010180", "swift": "", "country": "EG", "enabled": true, "bankName": " NATIONAL BANK OF EGYPT", "currency": "EGP", "accountHolder": "AHMED ABDALKADER", "accountNumber": "4573764479149445"}], "bankTransfer": {"enabled": true}, "mobileWallet": {"enabled": true}, "walletAccounts": [{"id": "acc-1788118561044-l3yc", "number": "01557794705", "enabled": true, "provider": "WALLET", "accountHolder": "ABDALLH GABER"}], "instapayAccounts": [{"id": "acc-1788118488645-bhkx", "account": "ahmedabdalkader588", "enabled": true, "accountHolder": "ahmed abdalkader"}], "processingNotice": ""}
\.


--
-- Data for Name: PortfolioFile; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PortfolioFile" (id, "portfolioProjectId", "fileUrl", "fileType", title, "sortOrder") FROM stdin;
\.


--
-- Data for Name: PortfolioItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PortfolioItem" (id, "engineerId", "imageUrl", description, "createdAt", "clientName", country, "disciplineId", status, title, year) FROM stdin;
1	1	https://res.cloudinary.com/bkv1llhu/image/upload/v1783749641/engineer-docs/xzw9rwbsmkrccmdyi8rc.png	Portfolio work 1	2026-07-11 06:00:48.564	\N	\N	\N	PUBLISHED	\N	\N
2	1	https://res.cloudinary.com/bkv1llhu/image/upload/v1783749646/engineer-docs/dkvahpu9fznr3cow2ypa.jpg	Portfolio work 2	2026-07-11 06:00:48.564	\N	\N	\N	PUBLISHED	\N	\N
3	1	https://res.cloudinary.com/bkv1llhu/image/upload/v1783749648/engineer-docs/plcyvtl6be9derrpkdrm.png	Portfolio work 3	2026-07-11 06:00:48.564	\N	\N	\N	PUBLISHED	\N	\N
9	3	https://res.cloudinary.com/bkv1llhu/image/upload/v1784922929/engineer-docs/gtfnqo5buenetvao9zxu.jpg	Portfolio work 1	2026-07-24 19:55:31.423	\N	\N	\N	PUBLISHED	\N	\N
10	3	https://res.cloudinary.com/bkv1llhu/image/upload/v1784922930/engineer-docs/rkf00doy3kjzttmszdzv.jpg	Portfolio work 2	2026-07-24 19:55:31.423	\N	\N	\N	PUBLISHED	\N	\N
11	3	https://res.cloudinary.com/bkv1llhu/image/upload/v1784922930/engineer-docs/nk5pncst1r5hs8qvluam.jpg	Portfolio work 3	2026-07-24 19:55:31.423	\N	\N	\N	PUBLISHED	\N	\N
15	8	/uploads/images/6768890c-f19e-4288-81d9-1eee69084e06.jpeg	Portfolio work 1	2026-09-05 18:36:16.937	\N	\N	\N	PUBLISHED	\N	\N
16	8	/uploads/images/1f03254a-849e-4dc4-b0d6-9511abf606e8.jpg	Portfolio work 2	2026-09-05 18:36:16.937	\N	\N	\N	PUBLISHED	\N	\N
17	8	/uploads/images/2e672675-b610-4a77-a9f2-10fcae2dff31.jpg	Portfolio work 3	2026-09-05 18:36:16.937	\N	\N	\N	PUBLISHED	\N	\N
27	17	https://res.cloudinary.com/bkv1llhu/image/upload/v1788694005/portfolio/t9tqcz44pdrdyuu2exvc.jpg	Portfolio work 1	2026-09-06 11:26:50.838	\N	\N	\N	PUBLISHED	\N	\N
28	17	https://res.cloudinary.com/bkv1llhu/image/upload/v1788694006/portfolio/baeshrqiavec42ld1jfp.jpg	Portfolio work 2	2026-09-06 11:26:50.838	\N	\N	\N	PUBLISHED	\N	\N
29	17	https://res.cloudinary.com/bkv1llhu/image/upload/v1788694007/portfolio/zvb9myki4thufeuq0cka.jpg	Portfolio work 3	2026-09-06 11:26:50.838	\N	\N	\N	PUBLISHED	\N	\N
30	17	https://res.cloudinary.com/bkv1llhu/image/upload/v1788694008/portfolio/jszyfkqyblwfq93ighcm.jpg	Portfolio work 4	2026-09-06 11:26:50.838	\N	\N	\N	PUBLISHED	\N	\N
31	17	https://res.cloudinary.com/bkv1llhu/image/upload/v1788694008/portfolio/nr1vfbg2f5fo9jjib84a.jpg	Portfolio work 5	2026-09-06 11:26:50.838	\N	\N	\N	PUBLISHED	\N	\N
32	17	https://res.cloudinary.com/bkv1llhu/image/upload/v1788694009/portfolio/joxzjxatqbnca07k6snc.jpg	Portfolio work 6	2026-09-06 11:26:50.838	\N	\N	\N	PUBLISHED	\N	\N
33	17	https://res.cloudinary.com/bkv1llhu/image/upload/v1788694009/portfolio/jkzeocrthzdi510pyiv4.jpg	Portfolio work 7	2026-09-06 11:26:50.838	\N	\N	\N	PUBLISHED	\N	\N
34	17	https://res.cloudinary.com/bkv1llhu/image/upload/v1788694010/portfolio/b0gqsq38pjnloyr55cxa.jpg	Portfolio work 8	2026-09-06 11:26:50.838	\N	\N	\N	PUBLISHED	\N	\N
35	18	https://res.cloudinary.com/bkv1llhu/image/upload/v1788726616/portfolio/ljzyywywzbioga1b5fii.jpg	Portfolio work 1	2026-09-06 20:30:17.593	\N	\N	\N	PUBLISHED	\N	\N
36	18	https://res.cloudinary.com/bkv1llhu/image/upload/v1788726616/portfolio/cytl4clfeayhail1kakf.jpg	Portfolio work 2	2026-09-06 20:30:17.593	\N	\N	\N	PUBLISHED	\N	\N
37	18	https://res.cloudinary.com/bkv1llhu/image/upload/v1788726617/portfolio/f8suzyfxmzdr2zot1if6.jpg	Portfolio work 3	2026-09-06 20:30:17.593	\N	\N	\N	PUBLISHED	\N	\N
\.


--
-- Data for Name: PortfolioProjectSkill; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PortfolioProjectSkill" ("portfolioProjectId", "skillId") FROM stdin;
\.


--
-- Data for Name: ProfileAnalytics; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ProfileAnalytics" ("engineerId", views, "searchImpressions", invitations, clicks) FROM stdin;
3	12	0	0	0
12	3	0	0	0
8	10	0	0	0
18	3	0	0	0
17	2	0	0	0
1	50	0	0	0
13	1	0	0	0
4	3	0	0	0
5	4	0	0	0
6	6	0	0	0
\.


--
-- Data for Name: ProfileCertification; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ProfileCertification" (id, "engineerId", "certificationId", year) FROM stdin;
\.


--
-- Data for Name: ProfileLanguage; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ProfileLanguage" ("engineerId", "languageId", proficiency) FROM stdin;
\.


--
-- Data for Name: ProfileServiceArea; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ProfileServiceArea" ("engineerId", "serviceAreaId") FROM stdin;
\.


--
-- Data for Name: ProfileSkill; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ProfileSkill" ("engineerId", "skillId") FROM stdin;
\.


--
-- Data for Name: ProfileSpecialization; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ProfileSpecialization" ("engineerId", "specializationId") FROM stdin;
\.


--
-- Data for Name: Project; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Project" (id, "clientId", title, description, budget, "serviceType", status, "createdAt", "updatedAt", "isFlagged", "progressNote", "progressUpdatedAt", "deliveredAt", "disputePausedAt", "disputeWindowClosesAt") FROM stdin;
1	6	فيلا سكنية علي مساحة 17*20 دورين	اريد فيلا سكنية علي مساحة المذكورة	100.00	DESIGN	OPEN	2026-07-11 05:33:28.159	2026-07-11 05:33:28.159	f	\N	\N	\N	\N	\N
5	1	Test for hiring	Description	1.00	DESIGN	IN_PROGRESS	2026-07-15 12:43:20.66	2026-07-15 12:45:04.009	f	\N	\N	\N	\N	\N
4	1	Test for bid	Drscription	10.00	DESIGN	COMPLETED	2026-07-15 12:06:38.876	2026-07-15 12:54:16.71	f	\N	\N	\N	\N	\N
2	9	Egypt	تصميم لوحة لمنزل ف القاهرة	8000.00	DESIGN	IN_PROGRESS	2026-07-11 19:41:38.778	2026-07-15 17:34:47.428	f	\N	\N	\N	\N	\N
6	9	Villa duplex	تفاصيل عند قبول العرض	200.00	DESIGN	OPEN	2026-07-15 18:06:20.15	2026-07-23 03:35:38.862	f	\N	\N	\N	\N	\N
8	4	A factory made of steel	A factory of cement at 20m*27m by steel	200.00	DESIGN	OPEN	2026-07-31 06:30:56.816	2026-07-31 06:30:56.816	f	\N	\N	\N	\N	\N
9	2	مشروع فيلا سكنية	فيلا سكنية مكونة من طابقين	100.00	DESIGN	OPEN	2026-07-31 06:55:41.92	2026-07-31 06:55:41.92	f	\N	\N	\N	\N	\N
11	1	Notification test	Description	100.00	DESIGN	CLOSED	2026-08-05 14:18:36.062	2026-08-07 12:36:22.418	f	\N	\N	\N	\N	\N
12	16	مشروع محطة قطار السريع	محط قطار السريع علي مسافة 100 كيلو متر	2500.00	DESIGN	IN_PROGRESS	2026-08-07 09:57:16.106	2026-08-07 15:20:11.768	f	\N	\N	\N	\N	\N
14	17	عمارة سكنية	عمارة سكنية ابعاد 20*15 وبها اناسسير وارتفاع 5 ادوار سكنية و دورين تجاري	500.00	DESIGN	IN_PROGRESS	2026-08-29 08:32:27.762	2026-08-29 08:39:24.706	f	\N	\N	\N	\N	\N
15	18	Restaurant at cairo	15 *17 meter square and above of it 2 floors	300.00	DESIGN	COMPLETED	2026-08-30 19:30:39.125	2026-08-30 19:43:24.087	f	\N	\N	\N	\N	\N
16	1	Payment	Decription	10.00	DESIGN	IN_PROGRESS	2026-09-05 04:14:50.077	2026-09-05 04:15:28.8	f	\N	\N	\N	\N	\N
17	19	مشروع فيلا مكونة من اربع ادوار وبها روف	تفاصيل عند قبول العرض	400.00	DESIGN	COMPLETED	2026-09-05 04:23:46.854	2026-09-05 06:30:37.29	f	\N	\N	2026-09-05 06:22:34.065	\N	2026-09-11 06:22:34.065
13	1	Notification test	Description	110.00	DESIGN	CANCELLED	2026-08-07 12:36:32.345	2026-09-05 18:27:59.349	f	\N	\N	\N	\N	\N
7	1	Edit test	Description	1.00	DESIGN	CANCELLED	2026-07-15 21:40:54.719	2026-09-05 18:28:19.516	f	\N	\N	\N	\N	\N
3	11	Title	Description	10.00	DESIGN	CANCELLED	2026-07-14 15:38:54.451	2026-09-05 18:28:26.987	f	\N	\N	\N	\N	\N
10	1	Notification test	Description	100.00	DESIGN	CANCELLED	2026-08-05 14:11:17.273	2026-09-05 18:28:34.523	f	\N	\N	\N	\N	\N
18	1	Test	Description	10.00	DESIGN	COMPLETED	2026-09-06 05:57:41.185	2026-09-06 06:02:37.905	f	\N	\N	2026-09-06 06:01:37.06	\N	2026-09-12 06:01:37.06
\.


--
-- Data for Name: ProjectDeliverable; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ProjectDeliverable" (id, "submissionId", type, url, name, "mimeType", "createdAt") FROM stdin;
1	2	FILE	/uploads/projects/264e990a-5685-4642-a664-904f22adce9f.jpg	Ø®ÙÙÙØ©.jpg	image/jpeg	2026-08-30 19:41:20.027
2	3	FILE	/uploads/projects/c0c40aa1-e11c-4b8d-a1c9-29a34e906de8.jpeg	IMG_1570.jpeg	image/jpeg	2026-09-05 06:22:34.072
3	4	FILE	https://res.cloudinary.com/bkv1llhu/image/upload/v1788674476/projects/iulcezpxgqz40sfv5hmh.jpg	9DF52FE6-80DF-4DBD-B9F4-34CB5D5F1626.jpeg	image/jpeg	2026-09-06 06:01:37.066
4	4	FILE	https://res.cloudinary.com/bkv1llhu/image/upload/v1788674496/projects/kxxv9ajhtuesqhlixgmq.jpg	FD9C2C99-1FE9-4870-A7B8-DF44E663BE06.jpeg	image/jpeg	2026-09-06 06:01:37.066
\.


--
-- Data for Name: ProjectInvitation; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ProjectInvitation" (id, "projectId", "engineerId", "clientId", status, "expiresAt", "createdAt", "updatedAt") FROM stdin;
2	6	6	9	CANCELLED	2026-07-22 18:08:39.883	2026-07-15 18:08:39.885	2026-07-23 03:35:38.854
\.


--
-- Data for Name: ProjectSubmission; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ProjectSubmission" (id, "projectId", "engineerId", notes, "revisionNote", "createdAt") FROM stdin;
1	4	2	Good	\N	2026-07-15 12:53:31.709
2	15	1	\N	\N	2026-08-30 19:41:20.024
3	17	1	لقد تم الانتهاء من المشروع	\N	2026-09-05 06:22:34.07
4	18	2	\N	\N	2026-09-06 06:01:37.064
\.


--
-- Data for Name: Review; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Review" (id, "projectId", "clientId", "engineerId", rating, comment, "createdAt") FROM stdin;
1	15	18	1	5	ماشاء الله شغل سريع وجودة ممتازة ي مهندس احمد	2026-08-30 19:43:24.08
\.


--
-- Data for Name: ServiceArea; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ServiceArea" (id, type, name) FROM stdin;
\.


--
-- Data for Name: Skill; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Skill" (id, name, "categoryId", "isOfficial", popularity) FROM stdin;
\.


--
-- Data for Name: SkillCategory; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SkillCategory" (id, name, icon, "sortOrder") FROM stdin;
\.


--
-- Data for Name: Specialization; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Specialization" (id, "disciplineId", name, "sortOrder") FROM stdin;
\.


--
-- Data for Name: SupportTicket; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SupportTicket" (id, name, email, subject, message, status, solution, "userId", "resolvedById", "resolvedAt", "createdAt", "updatedAt") FROM stdin;
1	ahmed abdalkader	ahmedabdalkader588@gmail.com	ban	i didnt now the system of clinka please return my account	SOLVED	ok ,solved your problem	6	8	2026-07-16 07:32:35.223	2026-07-15 17:45:34.537	2026-07-16 07:32:35.228
2	ahmed abdalkader	ahmedabdalkader588@gmail.com	حذر حسابي	لم اكن اعرف سياسات المنصة الرجاء اعاد الحساب	SOLVED	تم حل المشكلة	6	8	2026-07-16 07:39:00.498	2026-07-16 07:38:03.58	2026-07-16 07:39:00.499
\.


--
-- Data for Name: SystemAuditLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SystemAuditLog" (id, "timestamp", "actorId", "actorRole", action, "targetType", "targetId", "beforeState", "afterState", "ipAddress", "userAgent", "relatedTicketId") FROM stdin;
1	2026-09-04 09:12:37.312	8	ADMIN	admin.conversation_viewed	Conversation	16	\N	\N	154.236.158.140	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	\N
2	2026-09-05 04:19:04.646	8	ADMIN	admin.conversation_viewed	Conversation	17	\N	\N	105.202.165.244	Mozilla/5.0 (iPhone; CPU iPhone OS 26_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1	\N
3	2026-09-05 06:20:11.801	8	ADMIN	admin.manual_payment_verified	ManualPaymentSubmission	2	{"status": "PENDING"}	{"status": "VERIFIED", "adminNote": ""}	\N	\N	\N
4	2026-09-05 13:42:47.539	8	ADMIN	admin.conversation_viewed	Conversation	18	\N	\N	105.82.159.15	Mozilla/5.0 (iPhone; CPU iPhone OS 26_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1	\N
5	2026-09-05 13:48:04.604	\N	ANONYMOUS	RATE_LIMIT_EXCEEDED	RateLimit	t1.ip	\N	{"path": "/api/auth/register/engineer", "method": "POST"}	154.237.218.198	Mozilla/5.0 (Linux; Android 11; SM-A305F Build/RP1A.200720.012; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/151.0.7922.199 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/577.0.0.49.89;]	\N
6	2026-09-05 15:50:02.276	\N	ANONYMOUS	RATE_LIMIT_EXCEEDED	RateLimit	t1.ip	\N	{"path": "/api/auth/register/engineer", "method": "POST"}	105.202.225.37	Mozilla/5.0 (iPhone; CPU iPhone OS 26_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1	\N
7	2026-09-05 16:31:58.786	8	ADMIN	admin.conversation_viewed	Conversation	18	\N	\N	105.88.138.250	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N
8	2026-09-05 16:32:30.901	8	ADMIN	admin.conversation_viewed	Conversation	18	\N	\N	105.88.138.250	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N
9	2026-09-05 18:12:39.116	8	ADMIN	admin.conversation_viewed	Conversation	18	\N	\N	105.88.138.250	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N
10	2026-09-05 18:14:01.612	8	ADMIN	admin.conversation_viewed	Conversation	18	\N	\N	105.88.138.250	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N
11	2026-09-05 18:14:08.708	8	ADMIN	admin.conversation_viewed	Conversation	18	\N	\N	105.88.138.250	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N
12	2026-09-05 18:14:26.523	8	ADMIN	admin.conversation_viewed	Conversation	18	\N	\N	105.88.138.250	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N
13	2026-09-05 18:19:29.897	8	ADMIN	admin.conversation_viewed	Conversation	18	\N	\N	105.88.138.250	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N
14	2026-09-05 18:19:58.428	8	ADMIN	admin.conversation_viewed	Conversation	18	\N	\N	105.88.138.250	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N
15	2026-09-05 18:29:50.679	8	ADMIN	admin.conversation_viewed	Conversation	18	\N	\N	105.88.138.250	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N
16	2026-09-05 18:46:09.862	8	ADMIN	admin.conversation_viewed	Conversation	18	\N	\N	105.88.138.250	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	\N
17	2026-09-06 05:59:58.734	11	ADMIN	admin.manual_payment_verified	ManualPaymentSubmission	3	{"status": "PENDING"}	{"status": "VERIFIED", "adminNote": ""}	\N	\N	\N
18	2026-09-06 09:45:31.318	8	ADMIN	admin.conversation_viewed	Conversation	19	\N	\N	156.186.92.183	Mozilla/5.0 (iPhone; CPU iPhone OS 26_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1	\N
19	2026-09-07 05:01:19.668	8	ADMIN	admin.conversation_viewed	Conversation	20	\N	\N	105.204.39.226	Mozilla/5.0 (iPhone; CPU iPhone OS 26_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1	\N
20	2026-09-07 09:21:08.047	8	ADMIN	admin.conversation_viewed	Conversation	20	\N	\N	105.94.237.200	Mozilla/5.0 (iPhone; CPU iPhone OS 26_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1	\N
21	2026-09-07 09:21:24.306	8	ADMIN	admin.conversation_viewed	Conversation	14	\N	\N	105.94.237.200	Mozilla/5.0 (iPhone; CPU iPhone OS 26_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1	\N
22	2026-09-07 16:29:18.157	8	ADMIN	admin.conversation_viewed	Conversation	20	\N	\N	105.202.111.158	Mozilla/5.0 (iPhone; CPU iPhone OS 26_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/152.0.7977.64 Mobile/15E148 Safari/604.1	\N
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id, name, email, password, role, "isVerified", "createdAt", "updatedAt", "avatarUrl", "notificationPrefs", "googleId") FROM stdin;
5	عبدالرحمن أحمد	ahmedabdalkader533@gmail.com	$2b$10$gtQg11ep1rkfoVWnenqxieZnfCD2E62uWZTWj09TUWUjdrpJuBwxy	CLIENT	f	2026-07-11 05:22:16.417	2026-07-11 05:22:16.417	\N	\N	\N
17	mahmoud ahmed hassan	lotos76198@mediseat.com	$2b$10$41Rqce9dJJCNILo5vKrBt.nao4/8aoZnd6G0Floe0Wpl1BXqXeXQW	CLIENT	t	2026-08-29 08:29:17.941	2026-08-29 08:29:44.978	\N	\N	\N
9	Abdo Gaber	abdog8420@gmail.com	$2b$10$MbeMIa6hy62hK6KV/ocGjOA/XQ8E1luPEkLhIgDdtl5dDGcYk24VS	CLIENT	t	2026-07-11 19:40:47.242	2026-09-05 11:27:32.771	https://lh3.googleusercontent.com/a/ACg8ocLMSdpGIjpkEXiI3Oo0VbO6P3pbJi6-Ax5rrLq4uvA4EpkcFA=s96-c	\N	100750058319767669508
14	OTP	mohamedtalal@feng.bu.edu.eg	$2b$10$mA94juHHL7dBheqOYHEYi.kOrWj0NjicppdVpjmUZ36tybB5JyY2.	CLIENT	f	2026-08-05 12:29:20.128	2026-08-05 12:29:20.128	\N	\N	\N
1	Mohamed Talal	medoalashkam5@gmail.com	$2b$10$cQsvp0Kb3JgBP.V2o11UtOsxqDDQMkUaMsX537vS7Be7A/l.Kqqwq	CLIENT	t	2026-07-06 10:25:34.549	2026-09-06 06:01:24.39	https://lh3.googleusercontent.com/a/ACg8ocK7VeRMvatWvZ310QSXQDGQRpB0BlIkPRkDKKDtq6zQEG6_MOvZ=s96-c	\N	105123324411846207419
21	Ebrahim Hosni Ebrahim	ebrahimhosni2018@gmail.com	$2b$10$qQivxDPzAvEA/CYKvz0Yd.3tty17EkL60GCwk70pg5L2Deuqybywq	ENGINEER	t	2026-09-05 14:45:02.998	2026-09-05 14:45:02.998	https://lh3.googleusercontent.com/a/ACg8ocIB5UQv9PCPkPfEoMZqj4M6mHUwve0qNTOqD0ou4ZzdDQLT54ky=s96-c	\N	109342042123874726203
11	Mohamed Talal	medoalashkam9@gmail.com	$2b$10$z77E4QtQ6bKRy6KmAuhR2.EkucjuO4GkUNlql7nIG5qKFexvtgtRm	ADMIN	t	2026-07-14 15:35:11.398	2026-09-06 05:59:44.327	https://lh3.googleusercontent.com/a/ACg8ocKe07yLSHME1fZvHnsZWFVClvTYcf_jkWUTBL56TebVgjv8-A=s96-c	\N	115426116203854649503
7	ziad khlail	ziadashraf4467@gmail.com	$2b$10$QpsXwYJPwxzBoGQsa9YwPuiKQsZFc56Sy25uTU.Cd0s83BovZYqO6	CLIENT	t	2026-07-11 15:50:10.597	2026-07-11 21:04:54.822	https://lh3.googleusercontent.com/a/ACg8ocLnKcgBDYdsQA5VNy8uXVF2hC7p3dnvIRJPYiJMHZWb-RKJiJQZ=s96-c	\N	102657496035822830933
18	Sara ahmed	casegi1794@neowd.com	$2b$10$jFFN9th6WLceeDBpUqZy1OgVTCDs7.GADImiGEZm6ZIx9tJ2h3Uh2	CLIENT	t	2026-08-30 19:28:40.454	2026-08-30 19:29:01.602	\N	\N	\N
4	عبدالرحمن أحمد	ahmedabdalkader566@gmail.com	$2b$10$ZPpbgCAlsvbels3x1luZLu3IBA9qQKVZi2kwLYxJxcubfqsd96aoy	CLIENT	t	2026-07-11 05:06:54.413	2026-07-31 06:38:45.55	https://lh3.googleusercontent.com/a/ACg8ocJ5tW85m-fiJVuq594OWFDSeakgs_BPlJyjTdwyieE7YAe0vA=s96-c	\N	100706555648413036499
10	أحمد	ahmedabdalkader599@gmail.com	$2b$10$uICV0Pgtntp9c5sOJsPjmO13c919h3RECcpNZfBE7KtRVrM4aVoqy	CLIENT	f	2026-07-12 20:08:18.55	2026-07-12 20:08:18.55	\N	\N	\N
22	سارة محمد رشاد	saramohamed2310275@gmail.com	$2b$10$GOQkkt11beJehqTSEYqN4.fw4aS4/H.I4aUXnsYjc/fQ8x7rAy2HW	ENGINEER	t	2026-09-05 15:16:38.204	2026-09-05 15:16:38.204	https://lh3.googleusercontent.com/a/ACg8ocLYANdc7iflUF-_w6CAEFRzj1vid7hXjAEiTktc2HjoWamrOw=s96-c	\N	102120952757500748195
3	ahmed abdalkader	ahmedabdalkader577@gmail.com	$2b$10$iqrctafjxOSFaB1QmkukU.JjwxbYZWmVuon/DE9/5dNyjcc13S8wy	CLIENT	t	2026-07-11 04:49:35.756	2026-07-31 06:52:37.146	https://lh3.googleusercontent.com/a/ACg8ocInW90IR_dgW87FF0X3Fx-Hy_-6qmpgvS6NsNZ3bHc4sbuTVg=s96-c	\N	113897556465027014418
2	Ahmed Ahmed	ahmedabdalkader544@gmail.com	$2b$10$uAKYbQ/hBCvft89yRpLf7OOSIUdsQ1ARsRxugMx4wSqiy69Arba5i	CLIENT	t	2026-07-11 04:47:51.895	2026-07-31 06:54:16.089	https://lh3.googleusercontent.com/a/ACg8ocJHuR7cFKYBOgHxNwJSWIegmpt5XtXTX9Hku0RAx37YYkWIfg=s96-c	\N	110039699584446626903
15	OTP	medoalashkam11@gmail.com	$2b$10$VvRX5cCbd41rxNwdNHG7NeeCrlxk8BQKX7WSWzpzgLlcPcBmC4h9W	CLIENT	t	2026-08-05 12:31:19.335	2026-08-29 04:18:04.585	https://lh3.googleusercontent.com/a/ACg8ocLx0NTpHn9_RtlTKif-b42k-ixLz46SbTN4fzPGUx04cTuHZw=s96-c	\N	104968495347556852817
19	مدحت احمد	xocowit361@daugr.com	$2b$10$oqVlnnumKWv.UuJ7xk90EuY7mOXGKhO5dtYyuT1s4Uo3B0F3i.NH2	CLIENT	t	2026-09-05 04:21:51.148	2026-09-05 04:22:03.398	\N	\N	\N
28	Amar Kh	akh479393@gmail.com	$2b$10$t2x1ob1Ea6r5q1GEGkkLXOJwmpq2yC1SdCDYS3HocMYiY63q1/dTa	ENGINEER	t	2026-09-05 20:24:00.636	2026-09-05 20:24:00.636	https://lh3.googleusercontent.com/a/ACg8ocJ1K1M8n6gAGzhWGyukTiTlBltfxfocMxzPpoLKkc4gIAdTjQ=s96-c	\N	102016781611584877536
13	hossam mohamed	hossam.mohameda1z1@gmail.com	$2b$10$WF5YmPoHU6SUA8aKqr79deiJjDbANT5A6sqwGH00rBUkhdTbVDt6.	ENGINEER	t	2026-07-24 19:55:31.383	2026-07-24 20:02:03.23	https://lh3.googleusercontent.com/a/ACg8ocL1SOBz0jCGmssZkRUqKP8yGuw0Q0iAAYQ_yuC5HIDoyIQuovIM=s96-c	\N	106471099498293357270
24	kareem mohammed zaghlwl	kareemzaghlwl@gmail.com	$2b$10$yCjvcOiKJ1mAwhXvi/K9GuMvzWvl1Si1IgX9zj/34d2MnxdHfUZ.i	ENGINEER	t	2026-09-05 18:36:16.903	2026-09-06 13:35:43.185	https://res.cloudinary.com/bkv1llhu/image/upload/v1788701742/avatars/nk1f8m8wfbx1y1bwk4ff.png	\N	\N
16	gamal assam	focedey219@murkstar.com	$2b$10$rqKYFrbhNkwhmPUvc5nx8.qnq.cVjHD8M5Ae3TKGWbZkketmNYypG	CLIENT	t	2026-08-07 09:53:42.402	2026-08-07 09:54:04.334	\N	\N	\N
8	CLINKA engineering	clinkaengineering@gmail.com	$2b$10$xzD77rPEwzmIsDJMfGy8n.mZxym9ZcnkeOsPWmiDEBkYJOMwRD5xC	ADMIN	t	2026-07-11 18:23:01.507	2026-09-07 09:20:38.841	https://lh3.googleusercontent.com/a/ACg8ocKcYXutFxxYTTHdaH2m7UHWSJWCp5XkrS82miQ64qOBqZJdQN4=s96-c	\N	118127727513526429511
29	بشير محمد	z778215618@gmail.com	$2b$10$r/4mG4ppJBWajOF6H9FxXeMtAE0hmgP6b3.OUZOdbp6ZQuDhgquue	ENGINEER	t	2026-09-05 21:19:14.95	2026-09-05 21:19:14.95	https://lh3.googleusercontent.com/a/ACg8ocJT79ESRQJ2zRvC3wySud9c4ssIvNIw2cEqz9_D2XaSmIyppA=s96-c	\N	116865359395961353464
30	El-Sayed Khamies	sayedmontaser18@gmail.com	$2b$10$i9VJEuRr5frQJJkpy3m2buJ6S4ymo1vK3XvRVfZggBQDZgQ5iS69W	ENGINEER	t	2026-09-06 05:56:18.044	2026-09-06 05:56:18.044	https://lh3.googleusercontent.com/a/ACg8ocJQbd4m1N8iRcYSM2cgNt6KrVMScZ6yel8NKfpUPIiFzSgG5WF5CQ=s96-c	\N	111449615513394807785
6	ahmed abdalkader	ahmedabdalkader588@gmail.com	$2b$10$nB1mL7vVJrZ2PiABJmp5tOmtSOxbTwOKMEYJhnLrmRw3jLhJGBueS	ENGINEER	t	2026-07-11 05:24:15.77	2026-09-06 08:49:58.317	https://lh3.googleusercontent.com/a/ACg8ocKzBiK3gwgtjgxsgrN5HMF174p73R88UBamEm-uRc64YG0B2Ffd=s96-c	\N	109100105559823323972
33	Mohamed Hassan	maboseto@gmail.com	$2b$10$7MXEnzfuZuPOt4vVmVlnkekrv8GpSjjMlbMZRWDxHjtC0qNDCbPp6	ENGINEER	f	2026-09-06 11:26:50.82	2026-09-06 11:26:50.82	\N	\N	\N
20	Omar	oa7270766@gmail.com	$2b$10$Fd39e3R4SBynSM6duoGRk.ib1II./09OBgObhF4DXPqpQzzFi7rZW	ENGINEER	t	2026-09-05 11:38:20.607	2026-09-06 15:38:18.078	https://lh3.googleusercontent.com/a/ACg8ocJNtZ6OXYeCvZ6gnSB3TAeJIiCDFtI7eag9SR2VkV6WoaFFLQ=s96-c	\N	101731486471178142079
34	Kareem Yasin	kareembasyouni773@gmail.com	$2b$10$HbOIRP08kNvj0jhm5On6VeZHEHNAjRCq/fHxKGktd8tJKtN43B4Rm	ENGINEER	t	2026-09-06 20:25:37.016	2026-09-06 20:33:47.167	https://lh3.googleusercontent.com/a/ACg8ocLwdQtgVXcOHBA6YLvfIlVogEUj8ZqAL96QAXfy_UMkqbEOj38D=s96-c	\N	105965175750681827377
35	Mohamed Hares	hares99m@gmail.com	$2b$10$oKrYrQR48boaWhWNE71d4OnaaB0rqVAcEQrcInArgcjcuH3i/02yS	ENGINEER	t	2026-09-06 21:00:56.331	2026-09-06 21:00:56.331	https://lh3.googleusercontent.com/a/ACg8ocJDyoeXyrAe-jIkIwun94RGjJxyuuyb4WLaC-Fezj30bs4J3h0=s96-c	\N	104657325129570134435
36	Yasmeen Sabry	sabryyasmeen53@gmail.com	$2b$10$hYgI/DR3clRHntQH0fmTs.Jt.lddkQE9RBNixpN60sNCkJIwZSq9W	ENGINEER	t	2026-09-06 21:23:17.239	2026-09-06 21:23:17.239	https://lh3.googleusercontent.com/a/ACg8ocLDn2xnekm6JN5MvgLoryS3SgmdjU6G5xtED4bxiygDBMhZr24D=s96-c	\N	103277261304198621513
37	عبدالرحمن ماتع	abdulrahman.matae1@gmail.com	$2b$10$6uOFDAbCuD/fvIRf8DPGQOUfnln9BLGYoShLGOImIU0hTf7s4VkkO	ENGINEER	t	2026-09-06 22:45:31.262	2026-09-06 22:45:31.262	https://lh3.googleusercontent.com/a/ACg8ocKx6IcSRePUjhLay-dp7GzbpKgIjEqIK2EYyzmhsnaImCpCHw=s96-c	\N	103488987507386730712
38	Mariam Magdy	mariam.magdy164m@gmail.com	$2b$10$c.Kybg.ASPb1427RvuB9aO1hvvYxE5dB2VohZ2DayE4GAsNQYj7CC	ENGINEER	t	2026-09-07 06:33:46.418	2026-09-07 06:33:46.418	https://lh3.googleusercontent.com/a/ACg8ocKG521n072P7Ex3z86a7NLMw5Qvn2NfWa3BxBaWlkt23aYBrQ=s96-c	\N	111669073671054619187
\.


--
-- Data for Name: Wallet; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Wallet" (id, "userId", "availableBalance", "pendingBalance", "createdAt", "updatedAt", version, "heldByDispute") FROM stdin;
1	6	0.00	765.00	2026-07-12 20:01:39.84	2026-09-05 06:30:37.301	1	0.00
3	24	0.00	0.00	2026-09-05 18:36:36.39	2026-09-05 18:36:36.39	1	0.00
4	20	0.00	0.00	2026-09-06 11:44:22.636	2026-09-06 11:44:22.636	1	0.00
5	34	0.00	0.00	2026-09-06 20:30:18.82	2026-09-06 20:30:18.82	1	0.00
\.


--
-- Data for Name: WalletTransaction; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."WalletTransaction" (id, "walletId", amount, type, status, description, "availableAt", "relatedPaymentId", "relatedWithdrawalId", "createdAt") FROM stdin;
7	1	315.00	RELEASED	PENDING	Payment for "Restaurant at cairo". Available after 14-day hold.	2026-09-13 19:42:44.154	6	\N	2026-08-30 19:42:44.155
8	1	450.00	RELEASED	PENDING	Payment for "مشروع فيلا مكونة من اربع ادوار وبها روف". Available 7 days after delivery.	2026-09-12 06:22:34.065	8	\N	2026-09-05 06:30:37.313
\.


--
-- Data for Name: WithdrawalRequest; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."WithdrawalRequest" (id, "userId", amount, method, "accountNumber", status, "adminNotes", "processedAt", "createdAt", "updatedAt", "paymobTransactionId", "paymobDisbursementStatus", "paymobStatusDescription", "paymobClientReference", "idempotencyKey", "failureReason", "balanceHeldAt", "submittedAt", "lastInquiryAt", "payoutType", currency, country, "bankName", "accountHolderName", "ibanEncrypted", "swiftBic", "bankAddress", "accountHolderNameEncrypted", "swiftBicEncrypted", "bankAddressEncrypted", "externalReference", "internalNotes", "rejectionReason", "approvedAt", "approvedById", "completedAt", "completedById", "rejectedAt", "rejectedById", "reconciledAt", "reconciledById", "retryCount", "proofOriginalName", "proofUrl") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
9ce0b804-4b7d-4559-af84-0fe119da8e1a	b2bcd49f91a61839741bb4700fe348df6f3e42caff194f5bbc0dc8fdf862e6c8	2026-08-29 21:40:00.266595+00	20260829164300_manual_pay		\N	2026-08-29 21:40:00.266595+00	0
a6c5b66d-0eff-4450-ad45-28674e3e5f54	acbd26ff9870f53468e89505a497d25ba39f34f4c9fe01bbffe5908e8f6bb9fc	2026-07-05 13:38:34.53721+00	20260513124949_init	\N	\N	2026-07-05 13:38:34.456192+00	1
3e91cc99-f9b1-4f62-95c2-4ffed11ee083	1b172de67015ecd66414302f3fbe046a7bdbe5da3c5181adb6c31210daebd77e	2026-07-05 13:38:34.615507+00	20260619223733_bids_sol	\N	\N	2026-07-05 13:38:34.61389+00	1
e834063f-7d10-4789-8328-4dbe6fa4427f	8eaa10b79e9390aac491202558bd3076714930c8d9e5dbbdd0195f4c6d16132d	2026-07-05 13:38:34.540919+00	20260514093947_make_engineer_documents_optional	\N	\N	2026-07-05 13:38:34.538251+00	1
07359b5e-c4ff-4e3f-8769-f1c362e0c562	02f2f1311dcfefaab69301af6a5d388bca9507e9dc69c865495524f8301718b1	2026-07-05 13:38:34.545447+00	20260520120000_fawaterk_payment_gateway	\N	\N	2026-07-05 13:38:34.541525+00	1
99af6d2b-80dc-454d-aa94-f39d3c67aab2	bd86eda0e10e4eddc5b7396fb4c117eca60a466709f2aa46e46103e74944aaa8	2026-07-05 13:38:34.559284+00	20260521120000_profiles_notifications	\N	\N	2026-07-05 13:38:34.546026+00	1
222da32d-a984-4376-b58a-0151b1173ef2	1b0074ff0b761472360a1af78f09f17550c116811574605315c1a2b9fdf5070c	2026-07-05 13:38:34.638559+00	20260620120000_post_payment_workflow	\N	\N	2026-07-05 13:38:34.61605+00	1
f6d824c4-4053-4a47-8c0e-cc6932f5e545	0aa3fbc9eca309c44c81f11d5f55cef26ed077228061a1f531d9eee4a6152fee	2026-07-05 13:38:34.563762+00	20260521140000_google_auth	\N	\N	2026-07-05 13:38:34.560022+00	1
4578cfe7-14b6-488e-a74a-c57b8eac2a77	577e52e2e9b5d82394076e86e57e6b426231decd395add5e65c057547cb594d2	2026-07-05 13:38:34.567925+00	20260524123536_add_awaiting_approval_status	\N	\N	2026-07-05 13:38:34.564574+00	1
dcc8883f-74c1-4c6b-ae8d-a8c8e9bd230e	34ff26cccd07eb5e3c9bc9ed06c175515cd96719c8f634e0216cecdd38e7f5a4	2026-07-05 13:38:34.57143+00	20260524180000_message_attachments	\N	\N	2026-07-05 13:38:34.568744+00	1
fb55a3d0-f365-4d7d-8a39-8d88199a5f26	e172f94a7defadb4042ee9ab7c1865adf949bd3b19d1e2411837891d459f5f8a	2026-07-05 13:38:34.642628+00	20260620185901_payment	\N	\N	2026-07-05 13:38:34.639276+00	1
5bd34b72-41ef-4159-a3f7-482f1eecec8b	3b557735ba80d37a29060ac932b8dd32b6e4229c8ec8058b01666089b46a4c42	2026-07-05 13:38:34.583571+00	20260524200000_add_ban_system	\N	\N	2026-07-05 13:38:34.572018+00	1
42f2ec48-b6c1-4a9b-9f4a-5b6dec83ac8f	6482f3791084cf03bd8cf6a3382cbb5542fea693241b8cce5bb73b3bf888cd6a	2026-07-05 13:38:34.587016+00	20260524210000_ban_trigger_message	\N	\N	2026-07-05 13:38:34.584361+00	1
a3acf706-a189-4556-8221-de56d5fb3be5	1d22e3bd39e1de748df55be495ab71600542f0d87ad8ea72aa8e39d3ba3c7ff0	2026-07-05 13:38:34.594113+00	20260526112046_payment	\N	\N	2026-07-05 13:38:34.587878+00	1
1f49015d-ef80-42fe-b13e-e844e1dfbdb6	ea8f53aaa105e7c3adfb0d854f2e7d896ce8cbd6508c28ac41f6948bfa559389	2026-07-05 13:38:34.667212+00	20260621130000_wallet_withdrawals	\N	\N	2026-07-05 13:38:34.64319+00	1
5a866ecf-0c2c-49bc-b764-a602d12ed730	c868318232356fab30755f90f00e4e376807840fba48f975277375f62980bb03	2026-07-05 13:38:34.600287+00	20260616151906_admin_features	\N	\N	2026-07-05 13:38:34.594743+00	1
2af8865d-7176-4934-b4f7-018d7ca4ada5	b47ead3989e0cade62fe578d8dfa69bec61eeaf7a188cb3fd01c0e37cce705e3	2026-07-05 13:38:34.602925+00	20260616180702_add_nationality	\N	\N	2026-07-05 13:38:34.600946+00	1
37b9e6ad-fdf6-4004-b5f2-264d75459c7d	1da901df195d3b2bd35e9ce36d846b58bab526ca7a2c17a7f0a03ae3a6768ed2	2026-07-05 13:38:34.613364+00	20260617120000_support_tickets	\N	\N	2026-07-05 13:38:34.603738+00	1
6e6b5865-4395-4d1a-b4f1-e890faf3bcf6	5bc7d491a064310f0dc25e9deea7fdfe20008b548fd3fc9a7260635b0667c35d	2026-07-05 13:38:34.671357+00	20260621212756_antigravity	\N	\N	2026-07-05 13:38:34.667858+00	1
506375c1-e36b-44f7-89b2-161807086d72	5ce1c4fd00d75a98d013093fc1dcce02e6f35dfd6e644bef9e2e6917c7dc3c2d	2026-07-05 13:38:34.675957+00	20260629120000_paymob_auto_withdrawals	\N	\N	2026-07-05 13:38:34.671865+00	1
0d09a509-ddf8-4b88-a400-5418b3373b74	ccc124ff8fbb6278246e99a3ee608f2ea52b8b19ff3391829093b4d5894796cd	2026-07-08 21:02:07.175339+00	20260706120000_payout_hardening	\N	\N	2026-07-08 21:02:07.119149+00	1
ccef6474-78cc-40e3-ac23-ac25faef9e10	dd0648145770ff56c8d9c1c36c5889136b47639676703752a95e5f430fda5197	2026-07-11 01:31:30.983759+00	20260709120000_international_payouts	\N	\N	2026-07-11 01:31:30.965202+00	1
bd4676f2-669a-4c79-ac66-00fcbb11642a	7cafa7418c367ad72353dd71e0cae77044eb7e02c091ab3c63c7c996a2a21efc	\N	20260709120001_final_international_payouts	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20260709120001_final_international_payouts\n\nDatabase error code: 55P04\n\nDatabase error:\nERROR: unsafe use of new value "PENDING_REVIEW" of enum type "WithdrawalRequestStatus"\nHINT: New enum values must be committed before they can be used.\n\nPosition:\n[1m 58[0m\n[1m 59[0m -- One active international withdrawal per engineer\n[1m 60[0m CREATE UNIQUE INDEX IF NOT EXISTS "one_active_iban_per_user"\n[1m 61[0m   ON "WithdrawalRequest"("userId")\n[1m 62[0m   WHERE "payoutType" = 'IBAN'\n[1m 63[1;31m     AND status IN ('PENDING_REVIEW', 'APPROVED', 'TRANSFER_INITIATED', 'PROCESSING');[0m\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E55P04), message: "unsafe use of new value \\"PENDING_REVIEW\\" of enum type \\"WithdrawalRequestStatus\\"", detail: None, hint: Some("New enum values must be committed before they can be used."), position: Some(Original(2888)), where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("enum.c"), line: Some(97), routine: Some("check_safe_enum_use") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20260709120001_final_international_payouts"\n             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name="20260709120001_final_international_payouts"\n             at schema-engine/commands/src/commands/apply_migrations.rs:95\n   2: schema_core::state::ApplyMigrations\n             at schema-engine/core/src/state.rs:255	2026-07-11 02:12:25.009109+00	2026-07-11 01:31:30.984836+00	0
26111104-4946-44c2-bb00-5ba0c316d735	5a0a5601d2ea860ec0767e26a1dab449d2d20705ba78f3387066152b2d586374	2026-07-11 02:13:40.371066+00	20260709120001_final_international_payouts	\N	\N	2026-07-11 02:13:40.361494+00	1
9441deed-e00a-4c29-8892-fa5b211af294	3b8b284230b5c5b1b0f2bd6fd4fec90985eec6ec4e4efeeb32f106e6f23c23ba	\N	20260903233749_add_dispute_hold_and_schema_drift	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20260903233749_add_dispute_hold_and_schema_drift\n\nDatabase error code: 42701\n\nDatabase error:\nERROR: column "proofOriginalName" of relation "WithdrawalRequest" already exists\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42701), message: "column \\"proofOriginalName\\" of relation \\"WithdrawalRequest\\" already exists", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("tablecmds.c"), line: Some(7478), routine: Some("check_for_column_name_collision") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20260903233749_add_dispute_hold_and_schema_drift"\n             at schema-engine\\connectors\\sql-schema-connector\\src\\apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name="20260903233749_add_dispute_hold_and_schema_drift"\n             at schema-engine\\commands\\src\\commands\\apply_migrations.rs:95\n   2: schema_core::state::ApplyMigrations\n             at schema-engine\\core\\src\\state.rs:255	2026-09-04 00:04:52.85395+00	2026-09-03 23:58:39.786118+00	0
27fe0770-2f14-4836-abce-180e438a9851	5c33a7c360ba3ec9ac0d15594e120e491cd169e88e495305ec8289efd01e4f0e	2026-07-11 02:13:40.397282+00	20260709120002_international_payouts_columns	\N	\N	2026-07-11 02:13:40.372035+00	1
e8d2b2c4-cdda-40b0-a342-723f8e4e723c	e4f7c6b3932083cbbc48b18015567f68557b6bdfb2c90f161f1a78ca5ef6fda6	2026-08-29 21:40:14.16463+00	20260830120000_manual_payment_submissions	\N	\N	2026-08-29 21:40:12.945272+00	1
5b2876c6-c071-42b6-bee7-3ae55c215e2a	b2bcd49f91a61839741bb4700fe348df6f3e42caff194f5bbc0dc8fdf862e6c8	\N	20260829164300_manual_pay	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20260829164300_manual_pay\n\nDatabase error code: 42710\n\nDatabase error:\nERROR: type "AvailabilityStatus" already exists\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42710), message: "type \\"AvailabilityStatus\\" already exists", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("typecmds.c"), line: Some(1177), routine: Some("DefineEnum") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20260829164300_manual_pay"\n             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name="20260829164300_manual_pay"\n             at schema-engine/commands/src/commands/apply_migrations.rs:95\n   2: schema_core::state::ApplyMigrations\n             at schema-engine/core/src/state.rs:255	2026-08-29 21:40:00.10476+00	2026-08-29 21:19:35.11166+00	0
40e5e66f-de8d-4a9a-8014-d75a5c8598bc	4938bc6cc3df65d6e1158cff7c53f4432821331156699ad6609cc4a17a62ab67	2026-08-30 16:43:46.758436+00	20260830160000_payment_proof_and_destination_snapshot	\N	\N	2026-08-30 16:43:46.729338+00	1
aee0bda6-2046-4438-88cd-e40a2a553c40	e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855	2026-09-03 09:57:55.744195+00	20260830194400_manual_admin_payout	\N	\N	2026-09-03 09:57:55.736528+00	1
bfcbdd40-e231-4c66-b78f-eb975aea70fc	3b8b284230b5c5b1b0f2bd6fd4fec90985eec6ec4e4efeeb32f106e6f23c23ba	2026-09-04 00:06:49.054906+00	20260903233749_add_dispute_hold_and_schema_drift	\N	\N	2026-09-04 00:06:47.420265+00	1
be5bbdd1-1187-4c0f-ada4-75c6a7deb131	f0e21bea68a2f7447cc0cd3f31e669fba58e1c9089dbeecaaefe606b06bfbb94	2026-09-06 20:57:10.333235+00	20260906235500_remove_engineer_docs	\N	\N	2026-09-06 20:57:10.317127+00	1
\.


--
-- Name: Ban_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Ban_id_seq"', 2, true);


--
-- Name: Bid_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Bid_id_seq"', 15, true);


--
-- Name: Certification_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Certification_id_seq"', 1, false);


--
-- Name: Conversation_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Conversation_id_seq"', 20, true);


--
-- Name: Discipline_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Discipline_id_seq"', 1, false);


--
-- Name: Dispute_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Dispute_id_seq"', 1, false);


--
-- Name: EngineerProfile_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."EngineerProfile_id_seq"', 22, true);


--
-- Name: InvitationEvent_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."InvitationEvent_id_seq"', 7, true);


--
-- Name: Language_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Language_id_seq"', 1, false);


--
-- Name: ManualPaymentSubmission_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."ManualPaymentSubmission_id_seq"', 3, true);


--
-- Name: Message_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Message_id_seq"', 32, true);


--
-- Name: Notification_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Notification_id_seq"', 163, true);


--
-- Name: PaymentLedgerEntry_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."PaymentLedgerEntry_id_seq"', 23, true);


--
-- Name: Payment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Payment_id_seq"', 9, true);


--
-- Name: PayoutAuditLog_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."PayoutAuditLog_id_seq"', 19, true);


--
-- Name: PlatformSettings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."PlatformSettings_id_seq"', 1, true);


--
-- Name: PortfolioFile_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."PortfolioFile_id_seq"', 1, false);


--
-- Name: PortfolioItem_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."PortfolioItem_id_seq"', 37, true);


--
-- Name: ProfileCertification_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."ProfileCertification_id_seq"', 1, false);


--
-- Name: ProjectDeliverable_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."ProjectDeliverable_id_seq"', 4, true);


--
-- Name: ProjectInvitation_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."ProjectInvitation_id_seq"', 2, true);


--
-- Name: ProjectSubmission_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."ProjectSubmission_id_seq"', 4, true);


--
-- Name: Project_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Project_id_seq"', 18, true);


--
-- Name: Review_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Review_id_seq"', 1, true);


--
-- Name: ServiceArea_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."ServiceArea_id_seq"', 1, false);


--
-- Name: SkillCategory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."SkillCategory_id_seq"', 1, false);


--
-- Name: Skill_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Skill_id_seq"', 1, false);


--
-- Name: Specialization_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Specialization_id_seq"', 1, false);


--
-- Name: SupportTicket_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."SupportTicket_id_seq"', 2, true);


--
-- Name: SystemAuditLog_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."SystemAuditLog_id_seq"', 22, true);


--
-- Name: User_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."User_id_seq"', 38, true);


--
-- Name: WalletTransaction_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."WalletTransaction_id_seq"', 9, true);


--
-- Name: Wallet_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Wallet_id_seq"', 5, true);


--
-- Name: WithdrawalRequest_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."WithdrawalRequest_id_seq"', 5, true);


--
-- Name: Ban Ban_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Ban"
    ADD CONSTRAINT "Ban_pkey" PRIMARY KEY (id);


--
-- Name: Bid Bid_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Bid"
    ADD CONSTRAINT "Bid_pkey" PRIMARY KEY (id);


--
-- Name: Certification Certification_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Certification"
    ADD CONSTRAINT "Certification_pkey" PRIMARY KEY (id);


--
-- Name: Conversation Conversation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Conversation"
    ADD CONSTRAINT "Conversation_pkey" PRIMARY KEY (id);


--
-- Name: Discipline Discipline_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Discipline"
    ADD CONSTRAINT "Discipline_pkey" PRIMARY KEY (id);


--
-- Name: Dispute Dispute_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Dispute"
    ADD CONSTRAINT "Dispute_pkey" PRIMARY KEY (id);


--
-- Name: EngineerProfile EngineerProfile_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."EngineerProfile"
    ADD CONSTRAINT "EngineerProfile_pkey" PRIMARY KEY (id);


--
-- Name: ExchangeRateCache ExchangeRateCache_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ExchangeRateCache"
    ADD CONSTRAINT "ExchangeRateCache_pkey" PRIMARY KEY (id);


--
-- Name: InvitationEvent InvitationEvent_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."InvitationEvent"
    ADD CONSTRAINT "InvitationEvent_pkey" PRIMARY KEY (id);


--
-- Name: Language Language_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Language"
    ADD CONSTRAINT "Language_pkey" PRIMARY KEY (id);


--
-- Name: ManualPaymentSubmission ManualPaymentSubmission_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ManualPaymentSubmission"
    ADD CONSTRAINT "ManualPaymentSubmission_pkey" PRIMARY KEY (id);


--
-- Name: Message Message_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_pkey" PRIMARY KEY (id);


--
-- Name: Notification Notification_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_pkey" PRIMARY KEY (id);


--
-- Name: PaymentLedgerEntry PaymentLedgerEntry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PaymentLedgerEntry"
    ADD CONSTRAINT "PaymentLedgerEntry_pkey" PRIMARY KEY (id);


--
-- Name: Payment Payment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_pkey" PRIMARY KEY (id);


--
-- Name: PayoutAuditLog PayoutAuditLog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PayoutAuditLog"
    ADD CONSTRAINT "PayoutAuditLog_pkey" PRIMARY KEY (id);


--
-- Name: PlatformSettings PlatformSettings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PlatformSettings"
    ADD CONSTRAINT "PlatformSettings_pkey" PRIMARY KEY (id);


--
-- Name: PortfolioFile PortfolioFile_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PortfolioFile"
    ADD CONSTRAINT "PortfolioFile_pkey" PRIMARY KEY (id);


--
-- Name: PortfolioItem PortfolioItem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PortfolioItem"
    ADD CONSTRAINT "PortfolioItem_pkey" PRIMARY KEY (id);


--
-- Name: PortfolioProjectSkill PortfolioProjectSkill_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PortfolioProjectSkill"
    ADD CONSTRAINT "PortfolioProjectSkill_pkey" PRIMARY KEY ("portfolioProjectId", "skillId");


--
-- Name: ProfileAnalytics ProfileAnalytics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProfileAnalytics"
    ADD CONSTRAINT "ProfileAnalytics_pkey" PRIMARY KEY ("engineerId");


--
-- Name: ProfileCertification ProfileCertification_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProfileCertification"
    ADD CONSTRAINT "ProfileCertification_pkey" PRIMARY KEY (id);


--
-- Name: ProfileLanguage ProfileLanguage_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProfileLanguage"
    ADD CONSTRAINT "ProfileLanguage_pkey" PRIMARY KEY ("engineerId", "languageId");


--
-- Name: ProfileServiceArea ProfileServiceArea_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProfileServiceArea"
    ADD CONSTRAINT "ProfileServiceArea_pkey" PRIMARY KEY ("engineerId", "serviceAreaId");


--
-- Name: ProfileSkill ProfileSkill_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProfileSkill"
    ADD CONSTRAINT "ProfileSkill_pkey" PRIMARY KEY ("engineerId", "skillId");


--
-- Name: ProfileSpecialization ProfileSpecialization_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProfileSpecialization"
    ADD CONSTRAINT "ProfileSpecialization_pkey" PRIMARY KEY ("engineerId", "specializationId");


--
-- Name: ProjectDeliverable ProjectDeliverable_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProjectDeliverable"
    ADD CONSTRAINT "ProjectDeliverable_pkey" PRIMARY KEY (id);


--
-- Name: ProjectInvitation ProjectInvitation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProjectInvitation"
    ADD CONSTRAINT "ProjectInvitation_pkey" PRIMARY KEY (id);


--
-- Name: ProjectSubmission ProjectSubmission_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProjectSubmission"
    ADD CONSTRAINT "ProjectSubmission_pkey" PRIMARY KEY (id);


--
-- Name: Project Project_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Project"
    ADD CONSTRAINT "Project_pkey" PRIMARY KEY (id);


--
-- Name: Review Review_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Review"
    ADD CONSTRAINT "Review_pkey" PRIMARY KEY (id);


--
-- Name: ServiceArea ServiceArea_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ServiceArea"
    ADD CONSTRAINT "ServiceArea_pkey" PRIMARY KEY (id);


--
-- Name: SkillCategory SkillCategory_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SkillCategory"
    ADD CONSTRAINT "SkillCategory_pkey" PRIMARY KEY (id);


--
-- Name: Skill Skill_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Skill"
    ADD CONSTRAINT "Skill_pkey" PRIMARY KEY (id);


--
-- Name: Specialization Specialization_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Specialization"
    ADD CONSTRAINT "Specialization_pkey" PRIMARY KEY (id);


--
-- Name: SupportTicket SupportTicket_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SupportTicket"
    ADD CONSTRAINT "SupportTicket_pkey" PRIMARY KEY (id);


--
-- Name: SystemAuditLog SystemAuditLog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SystemAuditLog"
    ADD CONSTRAINT "SystemAuditLog_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: WalletTransaction WalletTransaction_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WalletTransaction"
    ADD CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY (id);


--
-- Name: Wallet Wallet_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Wallet"
    ADD CONSTRAINT "Wallet_pkey" PRIMARY KEY (id);


--
-- Name: WithdrawalRequest WithdrawalRequest_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WithdrawalRequest"
    ADD CONSTRAINT "WithdrawalRequest_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Ban_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Ban_userId_key" ON public."Ban" USING btree ("userId");


--
-- Name: Conversation_invitationId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Conversation_invitationId_key" ON public."Conversation" USING btree ("invitationId");


--
-- Name: Conversation_projectId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Conversation_projectId_key" ON public."Conversation" USING btree ("projectId");


--
-- Name: Discipline_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Discipline_name_key" ON public."Discipline" USING btree (name);


--
-- Name: Dispute_projectId_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Dispute_projectId_status_idx" ON public."Dispute" USING btree ("projectId", status);


--
-- Name: EngineerProfile_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "EngineerProfile_slug_key" ON public."EngineerProfile" USING btree (slug);


--
-- Name: EngineerProfile_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "EngineerProfile_userId_key" ON public."EngineerProfile" USING btree ("userId");


--
-- Name: ExchangeRateCache_base_target_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ExchangeRateCache_base_target_key" ON public."ExchangeRateCache" USING btree (base, target);


--
-- Name: InvitationEvent_invitationId_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "InvitationEvent_invitationId_createdAt_idx" ON public."InvitationEvent" USING btree ("invitationId", "createdAt");


--
-- Name: Language_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Language_code_key" ON public."Language" USING btree (code);


--
-- Name: Language_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Language_name_key" ON public."Language" USING btree (name);


--
-- Name: ManualPaymentSubmission_paymentMethod_transactionReference_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ManualPaymentSubmission_paymentMethod_transactionReference_key" ON public."ManualPaymentSubmission" USING btree ("paymentMethod", "transactionReference");


--
-- Name: Payment_projectId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Payment_projectId_key" ON public."Payment" USING btree ("projectId");


--
-- Name: PayoutAuditLog_withdrawalId_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PayoutAuditLog_withdrawalId_createdAt_idx" ON public."PayoutAuditLog" USING btree ("withdrawalId", "createdAt");


--
-- Name: ProjectInvitation_engineerId_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProjectInvitation_engineerId_status_idx" ON public."ProjectInvitation" USING btree ("engineerId", status);


--
-- Name: ProjectInvitation_projectId_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProjectInvitation_projectId_status_idx" ON public."ProjectInvitation" USING btree ("projectId", status);


--
-- Name: Review_projectId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Review_projectId_key" ON public."Review" USING btree ("projectId");


--
-- Name: ServiceArea_type_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ServiceArea_type_name_key" ON public."ServiceArea" USING btree (type, name);


--
-- Name: SkillCategory_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "SkillCategory_name_key" ON public."SkillCategory" USING btree (name);


--
-- Name: Skill_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Skill_name_key" ON public."Skill" USING btree (name);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: User_googleId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_googleId_key" ON public."User" USING btree ("googleId");


--
-- Name: Wallet_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Wallet_userId_key" ON public."Wallet" USING btree ("userId");


--
-- Name: WithdrawalRequest_paymobClientReference_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "WithdrawalRequest_paymobClientReference_key" ON public."WithdrawalRequest" USING btree ("paymobClientReference") WHERE ("paymobClientReference" IS NOT NULL);


--
-- Name: WithdrawalRequest_paymobTransactionId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "WithdrawalRequest_paymobTransactionId_idx" ON public."WithdrawalRequest" USING btree ("paymobTransactionId");


--
-- Name: WithdrawalRequest_status_updatedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "WithdrawalRequest_status_updatedAt_idx" ON public."WithdrawalRequest" USING btree (status, "updatedAt");


--
-- Name: WithdrawalRequest_userId_idempotencyKey_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "WithdrawalRequest_userId_idempotencyKey_key" ON public."WithdrawalRequest" USING btree ("userId", "idempotencyKey") WHERE ("idempotencyKey" IS NOT NULL);


--
-- Name: one_active_iban_per_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX one_active_iban_per_user ON public."WithdrawalRequest" USING btree ("userId") WHERE (("payoutType" = 'IBAN'::public."PayoutType") AND (status = ANY (ARRAY['PENDING_REVIEW'::public."WithdrawalRequestStatus", 'APPROVED'::public."WithdrawalRequestStatus", 'TRANSFER_INITIATED'::public."WithdrawalRequestStatus", 'PROCESSING'::public."WithdrawalRequestStatus"])));


--
-- Name: Ban Ban_bannedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Ban"
    ADD CONSTRAINT "Ban_bannedById_fkey" FOREIGN KEY ("bannedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Ban Ban_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Ban"
    ADD CONSTRAINT "Ban_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Bid Bid_engineerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Bid"
    ADD CONSTRAINT "Bid_engineerId_fkey" FOREIGN KEY ("engineerId") REFERENCES public."EngineerProfile"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Bid Bid_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Bid"
    ADD CONSTRAINT "Bid_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Conversation Conversation_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Conversation"
    ADD CONSTRAINT "Conversation_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Conversation Conversation_engineerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Conversation"
    ADD CONSTRAINT "Conversation_engineerId_fkey" FOREIGN KEY ("engineerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Conversation Conversation_invitationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Conversation"
    ADD CONSTRAINT "Conversation_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES public."ProjectInvitation"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Conversation Conversation_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Conversation"
    ADD CONSTRAINT "Conversation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Dispute Dispute_openedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Dispute"
    ADD CONSTRAINT "Dispute_openedById_fkey" FOREIGN KEY ("openedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Dispute Dispute_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Dispute"
    ADD CONSTRAINT "Dispute_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Dispute Dispute_resolvedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Dispute"
    ADD CONSTRAINT "Dispute_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: EngineerProfile EngineerProfile_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."EngineerProfile"
    ADD CONSTRAINT "EngineerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: InvitationEvent InvitationEvent_invitationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."InvitationEvent"
    ADD CONSTRAINT "InvitationEvent_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES public."ProjectInvitation"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ManualPaymentSubmission ManualPaymentSubmission_paymentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ManualPaymentSubmission"
    ADD CONSTRAINT "ManualPaymentSubmission_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES public."Payment"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Message Message_conversationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES public."Conversation"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Message Message_senderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Notification Notification_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PaymentLedgerEntry PaymentLedgerEntry_paymentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PaymentLedgerEntry"
    ADD CONSTRAINT "PaymentLedgerEntry_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES public."Payment"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Payment Payment_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Payment Payment_engineerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_engineerId_fkey" FOREIGN KEY ("engineerId") REFERENCES public."EngineerProfile"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Payment Payment_invitationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES public."ProjectInvitation"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Payment Payment_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PayoutAuditLog PayoutAuditLog_withdrawalId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PayoutAuditLog"
    ADD CONSTRAINT "PayoutAuditLog_withdrawalId_fkey" FOREIGN KEY ("withdrawalId") REFERENCES public."WithdrawalRequest"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PortfolioFile PortfolioFile_portfolioProjectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PortfolioFile"
    ADD CONSTRAINT "PortfolioFile_portfolioProjectId_fkey" FOREIGN KEY ("portfolioProjectId") REFERENCES public."PortfolioItem"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PortfolioItem PortfolioItem_disciplineId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PortfolioItem"
    ADD CONSTRAINT "PortfolioItem_disciplineId_fkey" FOREIGN KEY ("disciplineId") REFERENCES public."Discipline"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PortfolioItem PortfolioItem_engineerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PortfolioItem"
    ADD CONSTRAINT "PortfolioItem_engineerId_fkey" FOREIGN KEY ("engineerId") REFERENCES public."EngineerProfile"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PortfolioProjectSkill PortfolioProjectSkill_portfolioProjectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PortfolioProjectSkill"
    ADD CONSTRAINT "PortfolioProjectSkill_portfolioProjectId_fkey" FOREIGN KEY ("portfolioProjectId") REFERENCES public."PortfolioItem"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PortfolioProjectSkill PortfolioProjectSkill_skillId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PortfolioProjectSkill"
    ADD CONSTRAINT "PortfolioProjectSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES public."Skill"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProfileAnalytics ProfileAnalytics_engineerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProfileAnalytics"
    ADD CONSTRAINT "ProfileAnalytics_engineerId_fkey" FOREIGN KEY ("engineerId") REFERENCES public."EngineerProfile"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProfileCertification ProfileCertification_certificationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProfileCertification"
    ADD CONSTRAINT "ProfileCertification_certificationId_fkey" FOREIGN KEY ("certificationId") REFERENCES public."Certification"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProfileCertification ProfileCertification_engineerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProfileCertification"
    ADD CONSTRAINT "ProfileCertification_engineerId_fkey" FOREIGN KEY ("engineerId") REFERENCES public."EngineerProfile"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProfileLanguage ProfileLanguage_engineerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProfileLanguage"
    ADD CONSTRAINT "ProfileLanguage_engineerId_fkey" FOREIGN KEY ("engineerId") REFERENCES public."EngineerProfile"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProfileLanguage ProfileLanguage_languageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProfileLanguage"
    ADD CONSTRAINT "ProfileLanguage_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES public."Language"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProfileServiceArea ProfileServiceArea_engineerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProfileServiceArea"
    ADD CONSTRAINT "ProfileServiceArea_engineerId_fkey" FOREIGN KEY ("engineerId") REFERENCES public."EngineerProfile"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProfileServiceArea ProfileServiceArea_serviceAreaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProfileServiceArea"
    ADD CONSTRAINT "ProfileServiceArea_serviceAreaId_fkey" FOREIGN KEY ("serviceAreaId") REFERENCES public."ServiceArea"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProfileSkill ProfileSkill_engineerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProfileSkill"
    ADD CONSTRAINT "ProfileSkill_engineerId_fkey" FOREIGN KEY ("engineerId") REFERENCES public."EngineerProfile"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProfileSkill ProfileSkill_skillId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProfileSkill"
    ADD CONSTRAINT "ProfileSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES public."Skill"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProfileSpecialization ProfileSpecialization_engineerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProfileSpecialization"
    ADD CONSTRAINT "ProfileSpecialization_engineerId_fkey" FOREIGN KEY ("engineerId") REFERENCES public."EngineerProfile"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProfileSpecialization ProfileSpecialization_specializationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProfileSpecialization"
    ADD CONSTRAINT "ProfileSpecialization_specializationId_fkey" FOREIGN KEY ("specializationId") REFERENCES public."Specialization"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProjectDeliverable ProjectDeliverable_submissionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProjectDeliverable"
    ADD CONSTRAINT "ProjectDeliverable_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES public."ProjectSubmission"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProjectInvitation ProjectInvitation_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProjectInvitation"
    ADD CONSTRAINT "ProjectInvitation_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ProjectInvitation ProjectInvitation_engineerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProjectInvitation"
    ADD CONSTRAINT "ProjectInvitation_engineerId_fkey" FOREIGN KEY ("engineerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ProjectInvitation ProjectInvitation_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProjectInvitation"
    ADD CONSTRAINT "ProjectInvitation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProjectSubmission ProjectSubmission_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProjectSubmission"
    ADD CONSTRAINT "ProjectSubmission_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Project Project_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Project"
    ADD CONSTRAINT "Project_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Review Review_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Review"
    ADD CONSTRAINT "Review_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Review Review_engineerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Review"
    ADD CONSTRAINT "Review_engineerId_fkey" FOREIGN KEY ("engineerId") REFERENCES public."EngineerProfile"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Review Review_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Review"
    ADD CONSTRAINT "Review_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Skill Skill_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Skill"
    ADD CONSTRAINT "Skill_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."SkillCategory"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Specialization Specialization_disciplineId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Specialization"
    ADD CONSTRAINT "Specialization_disciplineId_fkey" FOREIGN KEY ("disciplineId") REFERENCES public."Discipline"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SupportTicket SupportTicket_resolvedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SupportTicket"
    ADD CONSTRAINT "SupportTicket_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SupportTicket SupportTicket_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SupportTicket"
    ADD CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SystemAuditLog SystemAuditLog_actorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SystemAuditLog"
    ADD CONSTRAINT "SystemAuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SystemAuditLog SystemAuditLog_relatedTicketId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SystemAuditLog"
    ADD CONSTRAINT "SystemAuditLog_relatedTicketId_fkey" FOREIGN KEY ("relatedTicketId") REFERENCES public."SupportTicket"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: WalletTransaction WalletTransaction_walletId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WalletTransaction"
    ADD CONSTRAINT "WalletTransaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES public."Wallet"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Wallet Wallet_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Wallet"
    ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: WithdrawalRequest WithdrawalRequest_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WithdrawalRequest"
    ADD CONSTRAINT "WithdrawalRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict Hfd3ci07Q1jotsGnzrvTpdGjbQ4xJdUdXoSFAGqoI3Qex58SHTfnMXZAkKaGgki

