from datetime import datetime, timezone


class AnomalyDetector:
    """Detects throughput anomalies: buffer red zones, declining throughput, etc."""

    def __init__(self, supabase_client, org_id: str):
        self.supabase = supabase_client
        self.org_id = org_id

    async def run_checks(self) -> list:
        """Run all anomaly detection rules. Returns list of triggered anomalies."""
        anomalies: list[dict] = []

        # Rule 1: Buffer in red zone
        buffers = (
            self.supabase.table("buffer_targets")
            .select("product_variant_id, current_zone")
            .eq("organization_id", self.org_id)
            .eq("current_zone", "red")
            .execute()
        )

        for buf in buffers.data or []:
            # Deduplication — same rule+entity in last 24h
            existing = (
                self.supabase.table("anomalies")
                .select("id")
                .eq("organization_id", self.org_id)
                .eq("rule_id", "buffer_red")
                .eq("entity_id", buf["product_variant_id"])
                .gte(
                    "created_at",
                    datetime.now(timezone.utc)
                    .replace(hour=0, minute=0)
                    .isoformat(),
                )
                .execute()
            )

            if not existing.data:
                anomalies.append(
                    {
                        "organization_id": self.org_id,
                        "rule_id": "buffer_red",
                        "severity": "critical",
                        "message": (
                            f"Buffer critically low for variant "
                            f"{buf['product_variant_id']} — risk of stockout"
                        ),
                        "entity_type": "buffer",
                        "entity_id": buf["product_variant_id"],
                    }
                )

        # Rule 2: Throughput trend declining (compare last 2 snapshots)
        snapshots = (
            self.supabase.table("toc_snapshots")
            .select("total_throughput, snapshot_date")
            .eq("organization_id", self.org_id)
            .order("snapshot_date", desc=True)
            .limit(2)
            .execute()
        )

        if snapshots.data and len(snapshots.data) >= 2:
            current = float(snapshots.data[0].get("total_throughput", 0))
            previous = float(snapshots.data[1].get("total_throughput", 0))
            if previous > 0 and current < previous * 0.85:
                anomalies.append(
                    {
                        "organization_id": self.org_id,
                        "rule_id": "throughput_down_15pct",
                        "severity": "warning",
                        "message": (
                            f"Throughput dropped "
                            f"{((previous - current) / previous * 100):.1f}% "
                            f"from ${previous:,.0f} to ${current:,.0f}"
                        ),
                        "entity_type": "system",
                    }
                )

        # Insert all new anomalies
        if anomalies:
            self.supabase.table("anomalies").insert(anomalies).execute()

        return anomalies
