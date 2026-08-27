import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface BaseEmailProps {
  title?: string;
  previewText?: string;
  content: string;
  ctaText?: string;
  ctaUrl?: string;
  recipientName?: string;
}

const brand = {
  navy: "#0B1D3A",
  teal: "#00B8D4",
  white: "#ffffff",
  slate: "#0D1B2A",
} as const;

export default function BaseEmail({
  title = "Phyresport",
  previewText = "Tienes un nuevo mensaje de Phyresport",
  content,
  ctaText,
  ctaUrl,
  recipientName,
}: BaseEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Text style={styles.logo}>{title}</Text>
          </Section>

          <Section style={styles.contentSection}>
            {recipientName && (
              <Text style={styles.greeting}>Hola {recipientName},</Text>
            )}
            <Heading as="h1" style={styles.heading}>
              {title}
            </Heading>
            <Text style={styles.paragraph}>{content}</Text>

            {ctaText && ctaUrl && (
              <Section style={styles.ctaSection}>
                <Button href={ctaUrl} style={styles.ctaButton}>
                  {ctaText}
                </Button>
              </Section>
            )}
          </Section>

          <Hr style={styles.divider} />

          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              Phyresport — Fisioterapia Deportiva de Precisión en Tenerife
            </Text>
            <Text style={styles.footerSmall}>
              ¿Dudas? Contáctanos en{" "}
              <Link href="mailto:info@phyresport.com" style={styles.link}>
                info@phyresport.com
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const styles = {
  body: {
    backgroundColor: brand.navy,
    margin: "0",
    padding: "24px",
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },
  container: {
    maxWidth: "600px",
    margin: "0 auto",
    backgroundColor: brand.slate,
    borderRadius: "8px",
    overflow: "hidden",
    border: `1px solid ${brand.teal}33`,
  },
  header: {
    backgroundColor: brand.navy,
    padding: "32px 24px",
    textAlign: "center" as const,
  },
  logo: {
    color: brand.teal,
    fontSize: "24px",
    fontWeight: "600",
    letterSpacing: "0.2em",
    margin: "0",
    textTransform: "uppercase" as const,
  },
  contentSection: {
    padding: "40px 32px",
  },
  greeting: {
    color: brand.white,
    fontSize: "16px",
    margin: "0 0 16px",
  },
  heading: {
    color: brand.white,
    fontSize: "28px",
    fontWeight: "400",
    margin: "0 0 24px",
    lineHeight: "1.2",
  },
  paragraph: {
    color: brand.white,
    fontSize: "16px",
    lineHeight: "1.6",
    margin: "0 0 24px",
    opacity: 0.85,
    whiteSpace: "pre-wrap" as const,
  },
  ctaSection: {
    textAlign: "center" as const,
    marginTop: "32px",
  },
  ctaButton: {
    backgroundColor: brand.teal,
    color: brand.white,
    borderRadius: "9999px",
    padding: "14px 28px",
    fontSize: "14px",
    fontWeight: "600",
    textDecoration: "none",
    textTransform: "uppercase" as const,
    letterSpacing: "0.1em",
  },
  divider: {
    borderColor: `${brand.teal}33`,
    margin: "0 32px",
  },
  footer: {
    padding: "32px",
    textAlign: "center" as const,
  },
  footerText: {
    color: brand.white,
    fontSize: "14px",
    margin: "0 0 8px",
    opacity: 0.9,
  },
  footerSmall: {
    color: brand.white,
    fontSize: "12px",
    margin: "4px 0",
    opacity: 0.6,
  },
  link: {
    color: brand.teal,
    textDecoration: "none",
  },
}