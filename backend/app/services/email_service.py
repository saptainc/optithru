from app.config import get_settings


class EmailService:
    def __init__(self):
        self.settings = get_settings()

    def _is_configured(self) -> bool:
        return bool(
            self.settings.RESEND_API_KEY
            and self.settings.RESEND_API_KEY != "re_placeholder"
        )

    async def send_welcome(
        self, to_email: str, org_name: str, dashboard_url: str
    ):
        if not self._is_configured():
            return {"status": "skipped", "reason": "no API key"}
        import resend

        resend.api_key = self.settings.RESEND_API_KEY
        return resend.Emails.send(
            {
                "from": self.settings.RESEND_FROM_EMAIL,
                "to": [to_email],
                "subject": f"Welcome to Throughput OS \u2014 {org_name}",
                "html": f"""
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #8B4513;">Welcome to Throughput OS</h1>
                <p>Hi there! Your organization <strong>{org_name}</strong> is ready.</p>
                <p>Start by connecting your Shopify or WooCommerce store to see your throughput metrics.</p>
                <a href="{dashboard_url}" style="display: inline-block; background: #8B4513; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">Go to Dashboard</a>
                <p style="color: #888; margin-top: 24px; font-size: 12px;">Throughput OS \u2014 Theory of Constraints Analytics</p>
            </div>
            """,
            }
        )

    async def send_invite(
        self, to_email: str, org_name: str, invite_url: str, inviter_name: str
    ):
        if not self._is_configured():
            return {"status": "skipped"}
        import resend

        resend.api_key = self.settings.RESEND_API_KEY
        return resend.Emails.send(
            {
                "from": self.settings.RESEND_FROM_EMAIL,
                "to": [to_email],
                "subject": f"{inviter_name} invited you to {org_name} on Throughput OS",
                "html": f"""
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #8B4513;">You're Invited</h1>
                <p><strong>{inviter_name}</strong> invited you to join <strong>{org_name}</strong> on Throughput OS.</p>
                <a href="{invite_url}" style="display: inline-block; background: #8B4513; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">Accept Invite</a>
                <p style="color: #888; margin-top: 24px; font-size: 12px;">This invite expires in 7 days.</p>
            </div>
            """,
            }
        )

    async def send_weekly_digest(
        self,
        to_email: str,
        org_name: str,
        kpis: dict,
        top_products: list,
    ):
        if not self._is_configured():
            return {"status": "skipped"}
        import resend

        resend.api_key = self.settings.RESEND_API_KEY

        product_rows = "".join(
            f"<tr><td style='padding:4px 8px'>{p['name']}</td><td style='padding:4px 8px;text-align:right'>${p['tpu']:.2f}</td></tr>"
            for p in top_products[:5]
        )

        return resend.Emails.send(
            {
                "from": self.settings.RESEND_FROM_EMAIL,
                "to": [to_email],
                "subject": f"Weekly Throughput Digest \u2014 {org_name}",
                "html": f"""
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #8B4513;">Weekly Throughput Digest</h1>
                <h3>{org_name}</h3>
                <table style="width:100%;border-collapse:collapse;margin:16px 0">
                    <tr><td style="padding:4px"><strong>Throughput:</strong></td><td style="text-align:right">${kpis.get('throughput', 0):,.0f}</td></tr>
                    <tr><td style="padding:4px"><strong>Net Profit:</strong></td><td style="text-align:right">${kpis.get('net_profit', 0):,.0f}</td></tr>
                    <tr><td style="padding:4px"><strong>Productivity:</strong></td><td style="text-align:right">{kpis.get('productivity', 0):.2f}</td></tr>
                </table>
                <h3>Top 5 Products by T/Unit</h3>
                <table style="width:100%;border-collapse:collapse">{product_rows}</table>
                <p style="color: #888; margin-top: 24px; font-size: 12px;">Throughput OS \u2014 Theory of Constraints Analytics</p>
            </div>
            """,
            }
        )

    async def send_payment_confirmation(
        self, to_email: str, plan: str, amount: float, next_billing: str
    ):
        if not self._is_configured():
            return {"status": "skipped"}
        import resend

        resend.api_key = self.settings.RESEND_API_KEY
        return resend.Emails.send(
            {
                "from": self.settings.RESEND_FROM_EMAIL,
                "to": [to_email],
                "subject": "Payment Confirmed \u2014 Throughput OS",
                "html": f"""
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #8B4513;">Payment Confirmed</h1>
                <p>Your <strong>{plan}</strong> plan subscription is active.</p>
                <p><strong>Amount:</strong> ${amount / 100:.2f}/month</p>
                <p><strong>Next billing:</strong> {next_billing}</p>
                <p style="color: #888; margin-top: 24px; font-size: 12px;">Throughput OS \u2014 Theory of Constraints Analytics</p>
            </div>
            """,
            }
        )
