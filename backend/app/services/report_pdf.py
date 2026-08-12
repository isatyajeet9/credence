import io

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from app.models.check import Check
from app.models.document import Document
from app.models.match import Match


def build_report_pdf(check: Check, document: Document, matches: list[Match]) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=2 * cm, bottomMargin=2 * cm)
    styles = getSampleStyleSheet()
    muted = ParagraphStyle("muted", parent=styles["Normal"], textColor=colors.HexColor("#5B6672"), fontSize=9)

    title_style = ParagraphStyle(
        "title", parent=styles["Title"], 
        textColor=colors.HexColor("#064E3B"), # Dark Green
        fontSize=26, spaceAfter=14, alignment=0
    )
    
    story = [
        Paragraph("Credence — Final Analysis Report", title_style),
        Paragraph(f"<b>File Name:</b> {document.original_filename or 'Pasted Text'}", styles["Normal"]),
        Paragraph(f"<b>Generated:</b> {check.completed_at.strftime('%Y-%m-%d %H:%M UTC') if check.completed_at else '-'}", muted),
        Spacer(1, 0.6 * cm),
    ]

    score_table = Table(
        [
            ["Originality score", "AI-text likelihood", "Confidence"],
            [
                f"{check.originality_score}%" if check.originality_score is not None else "-",
                f"{round(check.ai_likelihood_score * 100, 1)}%" if check.ai_likelihood_score is not None else "-",
                check.ai_confidence_band.value if check.ai_confidence_band else "-",
            ],
        ],
        colWidths=[6 * cm, 6 * cm, 5 * cm],
    )
    score_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E1F0EF")),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#D8DEE3")),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    story.append(score_table)
    story.append(Spacer(1, 0.8 * cm))

    if check.result_json and check.result_json.get("ai_text_reasons"):
        story.append(Paragraph("Why this AI-likelihood score", styles["Heading2"]))
        for reason in check.result_json["ai_text_reasons"]:
            story.append(Paragraph(f"• {reason}", styles["Normal"]))
        story.append(Spacer(1, 0.5 * cm))

    story.append(Paragraph(f"Evidence ({len(matches)} match{'es' if len(matches) != 1 else ''})", styles["Heading2"]))
    if not matches:
        story.append(Paragraph("No matching sources found.", muted))
    for match in matches:
        story.append(Spacer(1, 0.3 * cm))
        story.append(
            Paragraph(
                f"<b>{match.source_type.value.replace('_', ' ').title()}</b>: {match.source_reference} "
                f"&mdash; {round(match.similarity_score * 100, 1)}% similar",
                styles["Normal"],
            )
        )
        story.append(Paragraph(f"“{match.matched_excerpt}”", muted))

    story.append(Spacer(1, 1 * cm))
    story.append(
        Paragraph(
            "AI-detection results reflect a confidence level, not certainty. Short or atypical text lowers "
            "confidence automatically. This report should support human judgment, not replace it.",
            muted,
        )
    )

    doc.build(story)
    return buffer.getvalue()
