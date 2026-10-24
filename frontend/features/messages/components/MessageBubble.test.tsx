import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MessageBubble } from "./MessageBubble";

describe("MessageBubble", () => {
  it("renders with dir='auto' by default on the message text container", () => {
    const { container } = render(
      <MessageBubble side="them" name="Omar" time="10:30 AM">
        <span>مرحبا بالعالم! Hello 123</span>
      </MessageBubble>,
    );

    const messageContainer = container.querySelector('[dir="auto"]');
    expect(messageContainer).toBeInTheDocument();
    expect(messageContainer).toHaveTextContent("مرحبا بالعالم! Hello 123");
  });

  it("supports overriding dir attribute explicitly", () => {
    const { container } = render(
      <MessageBubble side="me" time="11:00 AM" dir="rtl">
        <span>النص العربي</span>
      </MessageBubble>,
    );

    const messageContainer = container.querySelector('[dir="rtl"]');
    expect(messageContainer).toBeInTheDocument();
    expect(messageContainer).toHaveTextContent("النص العربي");
  });

  it("renders avatar with initials for 'them' messages", () => {
    render(
      <MessageBubble side="them" name="Engineer Khalid" time="10:30 AM">
        <span>Project update</span>
      </MessageBubble>,
    );

    expect(screen.getByText("EK")).toBeInTheDocument();
    expect(screen.getByText("10:30 AM")).toBeInTheDocument();
  });

  it("does not render avatar for 'me' messages", () => {
    const { queryByText } = render(
      <MessageBubble side="me" name="Self" time="10:35 AM">
        <span>Sent message</span>
      </MessageBubble>,
    );

    expect(queryByText("Self")).toBeNull();
    expect(screen.getByText("10:35 AM")).toBeInTheDocument();
  });

  it("renders mixed Arabic, English, numbers, and URLs with dir='auto' on both 'me' and 'them' sides", () => {
    const mixedContent = "تفضل بزيارة الرابط https://clinka.com/project/101 أو الاتصال على الرقم 123456";
    const { container: containerThem } = render(
      <MessageBubble side="them" name="Engineer" time="10:40 AM">
        <p dir="auto" className="whitespace-pre-wrap break-words">{mixedContent}</p>
      </MessageBubble>,
    );

    const themBubble = containerThem.querySelector('div[dir="auto"]');
    expect(themBubble).toBeInTheDocument();
    expect(themBubble?.querySelector('p[dir="auto"]')).toHaveTextContent(mixedContent);

    const { container: containerMe } = render(
      <MessageBubble side="me" time="10:41 AM">
        <p dir="auto" className="whitespace-pre-wrap break-words">Thank you! شكراً لك</p>
      </MessageBubble>,
    );

    const meBubble = containerMe.querySelector('div[dir="auto"]');
    expect(meBubble).toBeInTheDocument();
    expect(meBubble?.querySelector('p[dir="auto"]')).toHaveTextContent("Thank you! شكراً لك");
  });
});
