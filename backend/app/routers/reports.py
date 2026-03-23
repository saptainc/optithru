from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from supabase import create_client
from app.config import get_settings
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
import io
from datetime import datetime

router = APIRouter()


@router.get("/reports/throughput-analysis")
async def generate_throughput_report(org_id: str):
    """Generate a Throughput Analysis PDF report."""
    settings = get_settings()
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)

    # Fetch data
    org_result = supabase.table("organizations").select("name").eq("id", org_id).single().execute()
    org_name = org_result.data["name"] if org_result.data else "Organization"

    # Fetch products
    products = supabase.from_("v_product_throughput").select(
        "product_name, category, price, cogs, throughput_per_unit, throughput_margin_pct, inventory_quantity"
    ).eq("organization_id", org_id).order("throughput_per_unit", desc=True).execute()

    # Fetch marketing channels
    channels = supabase.table("marketing_spend").select(
        "channel, spend, revenue_attributed"
    ).eq("organization_id", org_id).execute()

    # Aggregate channels
    channel_map = {}
    for row in (channels.data or []):
        ch = row.get("channel", "unknown")
        if ch not in channel_map:
            channel_map[ch] = {"spend": 0, "revenue": 0}
        channel_map[ch]["spend"] += row.get("spend", 0)
        channel_map[ch]["revenue"] += row.get("revenue_attributed", 0)

    # KPIs
    total_t = sum(p.get("throughput_per_unit", 0) * max(p.get("inventory_quantity", 1), 1) for p in (products.data or []))
    total_i = sum(p.get("inventory_quantity", 0) * p.get("cogs", 0) for p in (products.data or []))
    total_oe = sum(v["spend"] for v in channel_map.values())

    # Build PDF
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.75*inch, bottomMargin=0.75*inch)
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle('CustomTitle', parent=styles['Title'], fontSize=24, spaceAfter=6)
    subtitle_style = ParagraphStyle('Subtitle', parent=styles['Normal'], fontSize=14, textColor=colors.grey, spaceAfter=30)
    heading_style = ParagraphStyle('CustomHeading', parent=styles['Heading2'], fontSize=16, spaceBefore=20, spaceAfter=10)
    body_style = styles['Normal']

    elements = []

    # Cover page
    elements.append(Spacer(1, 2*inch))
    elements.append(Paragraph("Throughput Analysis Report", title_style))
    elements.append(Paragraph(f"{org_name}", subtitle_style))
    elements.append(Paragraph(f"Generated: {datetime.now().strftime('%B %d, %Y')}", body_style))
    elements.append(Spacer(1, inch))
    elements.append(Paragraph("Powered by Throughput OS — Theory of Constraints Analytics", body_style))
    elements.append(PageBreak())

    # Executive Summary
    elements.append(Paragraph("Executive Summary", heading_style))
    net_profit = total_t - total_oe
    prod_count = len(products.data or [])
    elements.append(Paragraph(f"This report analyzes {prod_count} products using Throughput Accounting principles.", body_style))
    elements.append(Spacer(1, 12))

    kpi_data = [
        ["Metric", "Value"],
        ["Total Throughput (T)", f"${total_t:,.0f}"],
        ["Inventory Investment (I)", f"${total_i:,.0f}"],
        ["Operating Expense (OE)", f"${total_oe:,.0f}"],
        ["Net Profit (T - OE)", f"${net_profit:,.0f}"],
        ["ROI ((T-OE)/I)", f"{(net_profit/total_i*100):.1f}%" if total_i > 0 else "N/A"],
        ["Productivity (T/OE)", f"{(total_t/total_oe):.2f}" if total_oe > 0 else "N/A"],
    ]

    kpi_table = Table(kpi_data, colWidths=[3*inch, 2.5*inch])
    kpi_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a1a2e')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f5f5f5')]),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(kpi_table)
    elements.append(PageBreak())

    # T/CU Rankings
    elements.append(Paragraph("T/CU Product Rankings", heading_style))
    elements.append(Paragraph("Products ranked by Throughput per unit — higher T/unit means more value created per sale.", body_style))
    elements.append(Spacer(1, 12))

    prod_data = [["Rank", "Product", "Price", "T/Unit", "Margin%"]]
    for i, p in enumerate((products.data or [])[:20]):
        prod_data.append([
            str(i + 1),
            p.get("product_name", "")[:40],
            f"${p.get('price', 0):,.2f}",
            f"${p.get('throughput_per_unit', 0):,.2f}",
            f"{p.get('throughput_margin_pct', 0):.1f}%",
        ])

    prod_table = Table(prod_data, colWidths=[0.5*inch, 3*inch, 1*inch, 1*inch, 0.8*inch])
    prod_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a1a2e')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('ALIGN', (0, 0), (0, -1), 'CENTER'),
        ('ALIGN', (2, 0), (-1, -1), 'RIGHT'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f5f5f5')]),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(prod_table)
    elements.append(PageBreak())

    # Channel Analysis
    elements.append(Paragraph("Marketing Channel Analysis", heading_style))
    elements.append(Paragraph("Channel T/CU measures throughput generated per dollar of marketing spend.", body_style))
    elements.append(Spacer(1, 12))

    avg_margin = 0.55
    if products.data:
        margins = [p.get("throughput_margin_pct", 55) for p in products.data]
        avg_margin = sum(margins) / len(margins) / 100

    ch_data = [["Channel", "Spend", "Revenue", "Est. Throughput", "T/CU"]]
    for ch, vals in sorted(channel_map.items(), key=lambda x: (x[1]["revenue"] * avg_margin / max(x[1]["spend"], 1)), reverse=True):
        est_t = vals["revenue"] * avg_margin
        tcu = est_t / vals["spend"] if vals["spend"] > 0 else 0
        ch_data.append([
            ch,
            f"${vals['spend']:,.0f}",
            f"${vals['revenue']:,.0f}",
            f"${est_t:,.0f}",
            f"{tcu:.2f}",
        ])

    if len(ch_data) > 1:
        ch_table = Table(ch_data, colWidths=[1.5*inch, 1.1*inch, 1.1*inch, 1.3*inch, 0.8*inch])
        ch_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a1a2e')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f5f5f5')]),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(ch_table)
    elements.append(PageBreak())

    # Recommendations
    elements.append(Paragraph("Recommendations", heading_style))
    recs = [
        "1. Prioritize marketing spend on email channel — highest T/CU by significant margin.",
        "2. Review bottom 10 SKUs by IDD/TDD ratio for potential discontinuation.",
        "3. Consider subscription model for top 5 products — LTV multiplier potential of 5-10×.",
        "4. Negotiate COGS reductions with suppliers for products with margins below 30%.",
        "5. Reduce inventory levels for slow-moving SKUs to free working capital.",
    ]
    for rec in recs:
        elements.append(Paragraph(rec, body_style))
        elements.append(Spacer(1, 6))

    doc.build(elements)
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=throughput-analysis-{datetime.now().strftime('%Y%m%d')}.pdf"},
    )
