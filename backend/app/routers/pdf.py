"""
PDF Document Generation Router for SAVIAN Railway Block Scheduling System.
Generates:
1. Indian Railways Form T/409 Caution Order PDF (Temporary Speed Restrictions).
2. Digital Track Possession Record & Block Permit PDF.
"""

from datetime import datetime, timezone
import io
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import HRFlowable, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from sqlmodel import Session, select

from app.database import get_session
from app.models import BlockDemand, GrantedBlock, ScheduleResult

router = APIRouter()


def _format_minutes(minutes: Optional[int]) -> str:
    """Convert minutes from midnight to HH:MM format."""
    if minutes is None:
        return "--:--"
    m = int(minutes) % 1440
    hh = m // 60
    mm = m % 60
    return f"{hh:02d}:{mm:02d} hrs"


@router.get("/t409/{solve_id}", summary="Generate Form T/409 Caution Order PDF")
def generate_t409_caution_order(
    solve_id: str,
    session: Session = Depends(get_session),
) -> StreamingResponse:
    """
    Generate official Indian Railways Form T/409 (Notice Station / Caution Order) PDF
    listing all track sections subjected to Temporary Speed Restrictions (TSR) in this solve.
    """
    # 1. Fetch solve result
    sched = session.exec(
        select(ScheduleResult).where(ScheduleResult.solve_id == solve_id)
    ).first()

    # 2. Fetch all granted blocks for this solve
    granted_rows = session.exec(
        select(GrantedBlock).where(GrantedBlock.solve_id == solve_id)
    ).all()

    # Collect demands with speed restrictions
    tsr_items: List[Dict[str, Any]] = []
    for gb in granted_rows:
        demand = session.exec(
            select(BlockDemand).where(BlockDemand.demand_code == gb.demand_code)
        ).first()

        if demand and demand.speed_restriction_kmph:
            tsr_items.append({
                "section": f"{gb.section_from} - {gb.section_to}",
                "start_km": f"{demand.start_km:.1f}",
                "end_km": f"{demand.end_km:.1f}",
                "speed": f"{demand.speed_restriction_kmph} km/h",
                "time": f"{_format_minutes(gb.granted_start_minutes)} - {_format_minutes(gb.granted_end_minutes)}",
                "department": demand.department,
                "reason": demand.activity_description or "Track Maintenance Work",
                "code": demand.demand_code,
            })

    # 3. Build ReportLab PDF
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36,
    )
    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        "T409Title",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=15,
        alignment=1,  # Center
        textColor=colors.HexColor("#1e293b"),
        spaceAfter=4,
    )
    subtitle_style = ParagraphStyle(
        "T409Subtitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=11,
        alignment=1,
        textColor=colors.HexColor("#0f172a"),
        spaceAfter=2,
    )
    meta_style = ParagraphStyle(
        "T409Meta",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        alignment=1,
        textColor=colors.HexColor("#475569"),
        spaceAfter=10,
    )
    cell_style = ParagraphStyle(
        "TableCell",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#0f172a"),
    )
    cell_bold = ParagraphStyle(
        "TableCellBold",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#0f172a"),
    )

    story = []

    # Header
    story.append(Paragraph("WEST CENTRAL RAILWAY - BHOPAL DIVISION", title_style))
    story.append(Paragraph("FORM T/409 : CAUTION ORDER", subtitle_style))
    story.append(Paragraph("UNDER RULES G&SR 4.09 & 4.10 - BINA JN (BINA) TO ITARSI JN (ET) SECTION", meta_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0f172a"), spaceAfter=10))

    # Meta Info Table
    meta_data = [
        [
            Paragraph(f"<b>Notice Station:</b> BINA JUNCTION", cell_style),
            Paragraph(f"<b>Issue Timestamp:</b> {datetime.now(timezone.utc).strftime('%d-%b-%Y %H:%M UTC')}", cell_style),
        ],
        [
            Paragraph(f"<b>Optimization Solve ID:</b> {solve_id[:18]}...", cell_style),
            Paragraph(f"<b>Recipient:</b> LOCO PILOT / TRAIN MANAGER (GUARD)", cell_style),
        ],
    ]
    meta_table = Table(meta_data, colWidths=[260, 260])
    meta_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 12))

    story.append(Paragraph("<b>TEMPORARY SPEED RESTRICTIONS (TSR) IN FORCE:</b>", cell_bold))
    story.append(Spacer(1, 6))

    # Table of Speed Restrictions
    table_headers = ["Section", "Kilometer", "TSR Limit", "Time Window", "Dept", "Reason / Work Scope"]
    table_rows = [[Paragraph(f"<b>{h}</b>", cell_bold) for h in table_headers]]

    if tsr_items:
        for it in tsr_items:
            table_rows.append([
                Paragraph(it["section"], cell_style),
                Paragraph(f"km {it['start_km']} - {it['end_km']}", cell_style),
                Paragraph(f"<b>{it['speed']}</b>", cell_bold),
                Paragraph(it["time"], cell_style),
                Paragraph(it["department"], cell_style),
                Paragraph(it["reason"], cell_style),
            ])
    else:
        table_rows.append([
            Paragraph("NO TEMPORARY SPEED RESTRICTIONS CURRENTLY IMPOSED", cell_style),
            Paragraph("-", cell_style),
            Paragraph("MPS (Normal)", cell_style),
            Paragraph("All day", cell_style),
            Paragraph("-", cell_style),
            Paragraph("All sections clear for maximum permissible speed", cell_style),
        ])

    tsr_table = Table(table_rows, colWidths=[80, 80, 65, 85, 45, 165])
    tsr_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e2e8f0")),
        ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#94a3b8")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(tsr_table)
    story.append(Spacer(1, 20))

    # Instructions & Signatures
    instructions = (
        "<b>SPECIAL INSTRUCTIONS:</b> Loco Pilots must observe strictly the speed restrictions indicated above. "
        "Audio-visual indications on Kavach-equipped locomotives must be acknowledged within 5 seconds. "
        "Do not exceed prescribed speeds until entire train has cleared the speed restriction board."
    )
    story.append(Paragraph(instructions, cell_style))
    story.append(Spacer(1, 30))

    sig_data = [
        [
            Paragraph("____________________________<br/><b>Station Master (Signature & Stamp)</b><br/>Notice Station", cell_style),
            Paragraph("____________________________<br/><b>Section Controller</b><br/>Control Office, Bhopal Division", cell_style),
            Paragraph("____________________________<br/><b>Loco Pilot / Guard</b><br/>Train Acknowledgment", cell_style),
        ]
    ]
    sig_table = Table(sig_data, colWidths=[175, 175, 170])
    sig_table.setStyle(TableStyle([
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(sig_table)

    doc.build(story)
    buffer.seek(0)

    filename = f"T409_Caution_Order_{solve_id[:8]}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename={filename}"},
    )


@router.get("/permit/{demand_id:path}", summary="Generate Digital Possession Record PDF (alias)", include_in_schema=False)
@router.get("/possession/{demand_id:path}", summary="Generate Digital Possession Record PDF")
def generate_possession_record(
    demand_id: str,
    session: Session = Depends(get_session),
) -> StreamingResponse:
    """
    Generate official Digital Block Possession Record & Safety Clearance Certificate
    for an authorized maintenance block demand.
    """
    # 1. Locate demand
    demand = None
    if demand_id.isdigit():
        demand = session.exec(select(BlockDemand).where(BlockDemand.id == int(demand_id))).first()
    if not demand:
        demand = session.exec(select(BlockDemand).where(BlockDemand.demand_code == demand_id)).first()

    if not demand:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"BlockDemand '{demand_id}' not found",
        )

    # 2. Check if granted block exists
    granted = session.exec(
        select(GrantedBlock).where(GrantedBlock.demand_code == demand.demand_code)
    ).first()

    start_min = granted.granted_start_minutes if granted else demand.requested_start_minutes
    end_min = granted.granted_end_minutes if granted else demand.requested_end_minutes
    is_shadow = granted.is_shadow if granted else False

    # 3. Build ReportLab PDF
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36,
    )
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "PossTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=15,
        alignment=1,
        textColor=colors.HexColor("#0f172a"),
        spaceAfter=4,
    )
    subtitle_style = ParagraphStyle(
        "PossSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=11,
        alignment=1,
        textColor=colors.HexColor("#047857"),
        spaceAfter=2,
    )
    cell_style = ParagraphStyle(
        "TableCell",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#0f172a"),
    )
    cell_bold = ParagraphStyle(
        "TableCellBold",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#0f172a"),
    )

    story = []

    # Title Banner
    story.append(Paragraph("INDIAN RAILWAYS - SAVIAN SYSTEM", title_style))
    story.append(Paragraph("DIGITAL TRACK POSSESSION RECORD & SAFETY MEMO", subtitle_style))
    story.append(Paragraph("BHOPAL DIVISION (WEST CENTRAL RAILWAY) - CORRIDOR TRAFFIC CONTROL", ParagraphStyle(
        "Meta", parent=styles["Normal"], fontSize=8, alignment=1, textColor=colors.HexColor("#64748b"), spaceAfter=10
    )))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#047857"), spaceAfter=12))

    # Grid Details
    details = [
        [Paragraph("<b>Demand Business Code:</b>", cell_bold), Paragraph(demand.demand_code, cell_style)],
        [Paragraph("<b>Engineering Department:</b>", cell_bold), Paragraph(f"{demand.department} ({demand.source_system})", cell_style)],
        [Paragraph("<b>Section Limits:</b>", cell_bold), Paragraph(f"{demand.section_from} to {demand.section_to} (km {demand.start_km:.1f} - {demand.end_km:.1f})", cell_style)],
        [Paragraph("<b>Authorized Window:</b>", cell_bold), Paragraph(f"<b>{_format_minutes(start_min)} to {_format_minutes(end_min)}</b> ({end_min - start_min} minutes)", cell_bold)],
        [Paragraph("<b>Scope of Work:</b>", cell_bold), Paragraph(demand.activity_description, cell_style)],
        [Paragraph("<b>Machinery Authorized:</b>", cell_bold), Paragraph(f"{demand.machinery_type or 'None'} (Asset ID: {demand.machinery_id or 'N/A'})", cell_style)],
        [Paragraph("<b>25kV Traction Power Cut:</b>", cell_bold), Paragraph("ISOLATION & EARTHING ISSUED" if demand.power_block_required else "NOT REQUIRED (Line Energized)", cell_style)],
        [Paragraph("<b>S&T Disconnection:</b>", cell_bold), Paragraph("FORM S&T-T/351 DISCONNECTION MEMO EXECUTED" if demand.disconnection_required else "NOT REQUIRED", cell_style)],
        [Paragraph("<b>Post-Work Speed Restriction:</b>", cell_bold), Paragraph(f"{demand.speed_restriction_kmph} km/h Caution Order Imposed" if demand.speed_restriction_kmph else "Normal Maximum Speed (130 km/h)", cell_style)],
        [Paragraph("<b>Shadow Block Coupling:</b>", cell_bold), Paragraph("PIGGYBACK SHADOW (Co-utilized track possession)" if is_shadow else "PRIMARY CORRIDOR MEGABLOCK", cell_style)],
        [Paragraph("<b>Lifecycle Status:</b>", cell_bold), Paragraph(f"<b>{demand.status}</b>", cell_bold)],
    ]

    t = Table(details, colWidths=[180, 340])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#f1f5f9")),
        ("BACKGROUND", (1, 0), (1, -1), colors.HexColor("#ffffff")),
        ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(t)
    story.append(Spacer(1, 20))

    cert_text = (
        "<b>CONTROLLER SAFETY CERTIFICATION:</b> "
        "SAVIAN has been formally suspended on the specified section under absolute block instrument locking. "
        "Signals leading to the section are clamped to 'ON' (Danger). "
        "Section Supervisor is authorized to enter and occupy track with accredited manpower and machinery."
    )
    story.append(Paragraph(cert_text, cell_style))
    story.append(Spacer(1, 35))

    sig_data = [
        [
            Paragraph("____________________________<br/><b>Section Engineer (In-charge)</b><br/>Field Possession Supervisor", cell_style),
            Paragraph("____________________________<br/><b>Station Master (Switching Post)</b><br/>Block Instrument Custodian", cell_style),
            Paragraph("____________________________<br/><b>Chief Traction / Traffic Controller</b><br/>Divisional Control Office, BPL", cell_style),
        ]
    ]
    sig_table = Table(sig_data, colWidths=[175, 175, 170])
    sig_table.setStyle(TableStyle([
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(sig_table)

    doc.build(story)
    buffer.seek(0)

    clean_code = demand.demand_code.replace("/", "_").replace("-", "_")
    filename = f"Possession_Memo_{clean_code}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename={filename}"},
    )
