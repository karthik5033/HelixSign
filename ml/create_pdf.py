"""
create_pdf.py — Builds the publication-quality HelixSign Presentation Dossier PDF.
"""
import os
import sys
from pathlib import Path
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, KeepTogether, HRFlowable, PageBreak
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    """Two-pass canvas to dynamically compute and print total page numbers."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_header_footer(num_pages)
            super().showPage()
        super().save()

    def draw_header_footer(self, page_count):
        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#64748b"))

        # Running header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 755, "HelixSign — Quantitative Presentation & Defense Dossier")
            self.drawRightString(558, 755, "ML & Data Subsystem (Version 1.5.0)")
            self.setStrokeColor(colors.HexColor("#cbd5e1"))
            self.setLineWidth(0.5)
            self.line(54, 748, 558, 748)

        # Running footer
        self.setFont("Helvetica", 8)
        self.drawString(54, 38, "Confidential — Prepared for Academic Review & Evaluation")
        self.drawRightString(558, 38, f"Page {self._pageNumber} of {page_count}")
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(54, 48, 558, 48)

        self.restoreState()


def build_pdf(filename: str):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0f172a'),
        spaceAfter=4,
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#334155'),
        spaceAfter=10,
    )
    meta_style = ParagraphStyle(
        'DocMeta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#64748b'),
    )
    h1_style = ParagraphStyle(
        'SectionH1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=colors.HexColor('#1e3a8a'),
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True,
    )
    h2_style = ParagraphStyle(
        'SectionH2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=14,
        textColor=colors.HexColor('#0f172a'),
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True,
    )
    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#1e293b'),
        spaceAfter=6,
    )
    bullet_style = ParagraphStyle(
        'DocBullet',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12.5,
        textColor=colors.HexColor('#1e293b'),
        leftIndent=12,
        spaceAfter=3,
    )
    table_cell = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10.5,
        textColor=colors.HexColor('#0f172a'),
    )
    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10.5,
        textColor=colors.HexColor('#0f172a'),
    )
    table_header = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10.5,
        textColor=colors.white,
    )
    callout_style = ParagraphStyle(
        'CalloutText',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#1e3a8a'),
    )
    eq_style = ParagraphStyle(
        'EquationText',
        parent=styles['Normal'],
        fontName='Courier-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#0f172a'),
        alignment=1, # center
    )

    story = []

    # ---------------------------------------------------------
    # Cover / Header Banner
    # ---------------------------------------------------------
    story.append(Paragraph("HelixSign: Quantitative Evaluation & Defense Dossier", title_style))
    story.append(Paragraph("DNA Steganography & Watermarking in <i>E. coli</i> CDS — Mathematical Formulations, Benchmark Verification, and Engineering Boundaries", subtitle_style))
    story.append(Paragraph("<b>Author:</b> Person 3 (ML & Data Lead) &nbsp;|&nbsp; <b>Specification:</b> Version 1.5.0 &nbsp;|&nbsp; <b>Commit:</b> <font name='Courier'>f60d0d5</font> &nbsp;|&nbsp; <b>Date:</b> November 2026", meta_style))
    story.append(Spacer(1, 4))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#1e3a8a"), spaceAfter=10))

    # ---------------------------------------------------------
    # Section 1: Experimental Setup & Zero Data Leakage
    # ---------------------------------------------------------
    story.append(Paragraph("1. Experimental Setup & Zero-Contamination Partitioning", h1_style))
    story.append(Paragraph(
        "To guarantee unbiased evaluation without data leakage, the entire <i>Escherichia coli</i> K-12 MG1655 coding sequence "
        "genome (4,290 genes) was curated and partitioned strictly by gene identity:",
        body_style
    ))

    setup_data = [
        [Paragraph("Partition", table_header), Paragraph("Count", table_header), Paragraph("Sampling & Role in Evaluation", table_header)],
        [Paragraph("<b>Training Partition</b>", table_cell), Paragraph("2,400 genes", table_cell), Paragraph("Used exclusively to train k-mer XGBoost and 1D CNN detectors.", table_cell)],
        [Paragraph("<b>Validation Partition</b>", table_cell), Paragraph("548 genes", table_cell), Paragraph("Hyperparameter tuning and early stopping checkpoint validation.", table_cell)],
        [Paragraph("<b>Test Partition</b>", table_cell), Paragraph("568 genes", table_cell), Paragraph("Strictly isolated held-out partition used for multi-seed AUC scoring.", table_cell)],
        [Paragraph("<b>5 Benchmark Genes</b>", table_cell), Paragraph("5 genes", table_cell), Paragraph("<code>b3920</code> (600bp), <code>b1703</code> (894bp), <code>b2022</code> (1170bp), <code>b0930</code> (1620bp), <code>b0568</code> (2973bp). Excluded from all model training; used for channel noise benchmarking.", table_cell)],
    ]
    t_setup = Table(setup_data, colWidths=[1.4*inch, 1.0*inch, 4.6*inch])
    t_setup.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1e3a8a')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f8fafc')]),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_setup)
    story.append(Spacer(1, 8))

    # ---------------------------------------------------------
    # Section 2: Substitution Noise Benchmark
    # ---------------------------------------------------------
    story.append(Paragraph("2. Watermark Recovery Under Substitution Noise", h1_style))
    story.append(Paragraph(
        "<b>Figure Reconciliation (92.6% vs 92.9%):</b> Earlier preliminary reports cited 92.6% recovery at 5.0% noise based on a "
        "single test gene (<code>b2022</code>, length 1,170 bp, mean 92.61%). The final certified benchmark macro-averages over "
        "<b>all 5 held-out genes</b> across 150 total Monte Carlo trials (30 trials/gene), yielding <b>92.9% ± 1.1%</b> (range 91.7%–94.6%). "
        "All figures reflect <i>raw extraction without Reed-Solomon ECC</i>.",
        body_style
    ))

    sub_data = [
        [Paragraph("Substitution Rate", table_header), Paragraph("Raw Bit Recovery", table_header), Paragraph("Macro [Min–Max] Range", table_header), Paragraph("Mean Erasure Rate", table_header), Paragraph("Mean BER (Non-Erased)", table_header)],
        [Paragraph("0.1%", table_cell_bold), Paragraph("100.0% ± 0.0%", table_cell), Paragraph("[100.0% – 100.0%]", table_cell), Paragraph("0.0%", table_cell), Paragraph("0.000", table_cell)],
        [Paragraph("0.5%", table_cell_bold), Paragraph("99.4% ± 0.1%", table_cell), Paragraph("[99.3% – 99.5%]", table_cell), Paragraph("0.0%", table_cell), Paragraph("0.006", table_cell)],
        [Paragraph("1.0%", table_cell_bold), Paragraph("97.7% ± 0.2%", table_cell), Paragraph("[97.4% – 97.9%]", table_cell), Paragraph("0.0%", table_cell), Paragraph("0.023", table_cell)],
        [Paragraph("2.0%", table_cell_bold), Paragraph("96.9% ± 0.3%", table_cell), Paragraph("[96.3% – 97.1%]", table_cell), Paragraph("0.0%", table_cell), Paragraph("0.031", table_cell)],
        [Paragraph("3.0%", table_cell_bold), Paragraph("95.0% ± 0.5%", table_cell), Paragraph("[94.6% – 95.9%]", table_cell), Paragraph("0.0%", table_cell), Paragraph("0.050", table_cell)],
        [Paragraph("5.0%", table_cell_bold), Paragraph("92.9% ± 1.1%", table_cell), Paragraph("[91.7% – 94.6%]", table_cell), Paragraph("0.0%", table_cell), Paragraph("0.071", table_cell)],
    ]
    t_sub = Table(sub_data, colWidths=[1.1*inch, 1.4*inch, 1.6*inch, 1.3*inch, 1.6*inch])
    t_sub.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1e3a8a')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f8fafc')]),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(t_sub)
    story.append(Spacer(1, 6))

    sub_chart_path = "artifacts/presentation_charts/sub_chart.png"
    if os.path.exists(sub_chart_path):
        story.append(Image(sub_chart_path, width=5.2*inch, height=2.6*inch))

    story.append(Spacer(1, 10))

    # ---------------------------------------------------------
    # Section 3: Indel Robustness & Frameshift Analysis
    # ---------------------------------------------------------
    story.append(PageBreak())
    story.append(Paragraph("3. Impact of Insertions & Deletions on Watermark Recovery", h1_style))
    story.append(Paragraph(
        "<b>The Frameshift Bottleneck:</b> Indels are fundamentally more destructive than substitutions because a single insertion "
        "or deletion causes a catastrophic frameshift that corrupts all downstream codon triplets. The table below documents "
        "the monotonic degradation of raw extraction fidelity under combined indels (macro-averaged over 5 genes, 30 trials/gene):",
        body_style
    ))

    indel_data = [
        [Paragraph("Indel Rate", table_header), Paragraph("Raw Bit Recovery", table_header), Paragraph("Reported Interval", table_header), Paragraph("Mean Erasure Rate", table_header), Paragraph("Mean BER (Non-Erased)", table_header)],
        [Paragraph("0.1%", table_cell_bold), Paragraph("45.0% ± 18.0%", table_cell), Paragraph("[20.0% – 70.0%]", table_cell), Paragraph("54.7% ± 18.0%", table_cell), Paragraph("0.007", table_cell)],
        [Paragraph("0.5%", table_cell_bold), Paragraph("16.8% ± 10.4%", table_cell), Paragraph("[2.7% – 29.5%]", table_cell), Paragraph("80.0% ± 11.3%", table_cell), Paragraph("0.180", table_cell)],
        [Paragraph("1.0%", table_cell_bold), Paragraph("12.6% ± 5.4%", table_cell), Paragraph("[6.9% – 19.7%]", table_cell), Paragraph("84.7% ± 6.1%", table_cell), Paragraph("0.188", table_cell)],
        [Paragraph("2.0%", table_cell_bold), Paragraph("5.8% ± 4.1%", table_cell), Paragraph("[0.0% – 11.2%]", table_cell), Paragraph("92.0% ± 6.1%", table_cell), Paragraph("0.248", table_cell)],
    ]
    t_indel = Table(indel_data, colWidths=[1.1*inch, 1.4*inch, 1.5*inch, 1.4*inch, 1.6*inch])
    t_indel.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#991b1b')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#fef2f2')]),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(t_indel)
    story.append(Spacer(1, 6))

    indel_chart_path = "artifacts/presentation_charts/indel_chart.png"
    if os.path.exists(indel_chart_path):
        story.append(Image(indel_chart_path, width=5.2*inch, height=2.6*inch))

    story.append(Spacer(1, 4))
    story.append(Paragraph(
        "<b>Architectural Resolution (Version 1.5.0 Contract):</b> To recover downstream codons, the system uses pairwise alignment "
        "to track intact triplet boundaries, passing arbitrary 0-indexed nucleotide start offsets (<code>carrierStartOffsets</code>) "
        "rather than multiples of 3. Ruptured codons are explicitly passed as <code>null</code>, producing <code>confidence = 0.0</code> "
        "erasure markers for the Reed-Solomon decoder.",
        callout_style
    ))
    story.append(Spacer(1, 10))

    # ---------------------------------------------------------
    # Section 4: Machine Learning Detector Evaluation
    # ---------------------------------------------------------
    story.append(Paragraph("4. Machine Learning Detector Evaluation (Stealth Benchmarking)", h1_style))
    story.append(Paragraph(
        "Two high-capacity classifier architectures were trained on 2,400 native genes and 2,400 watermarked variants, and evaluated "
        "across three random seeds (42, 100, 2026) on 568 strictly held-out test genes:",
        body_style
    ))

    det_data = [
        [Paragraph("Detector Model", table_header), Paragraph("Target Variant", table_header), Paragraph("Mean ROC-AUC", table_header), Paragraph("Std Dev", table_header), Paragraph("Discrimination Finding", table_header)],
        [Paragraph("<b>4,416 k-mer XGBoost</b>", table_cell), Paragraph("Naive Baseline", table_cell), Paragraph("0.9996", table_cell_bold), Paragraph("± 0.0000", table_cell), Paragraph("Easily Detected (AUC ~ 1.00)", table_cell)],
        [Paragraph("<b>4,416 k-mer XGBoost</b>", table_cell), Paragraph("HelixSign Stealth", table_cell), Paragraph("0.4775", table_cell_bold), Paragraph("± 0.0122", table_cell), Paragraph("Stealthy (Indistinguishable from chance)", table_cell)],
        [Paragraph("<b>1D CNN (Multi-Window)</b>", table_cell), Paragraph("Naive Baseline", table_cell), Paragraph("0.9955", table_cell_bold), Paragraph("± 0.0064", table_cell), Paragraph("Easily Detected (AUC ~ 1.00)", table_cell)],
        [Paragraph("<b>1D CNN (Multi-Window)</b>", table_cell), Paragraph("HelixSign Stealth", table_cell), Paragraph("0.5032", table_cell_bold), Paragraph("± 0.0263", table_cell), Paragraph("Stealthy (Indistinguishable from chance)", table_cell)],
    ]
    t_det = Table(det_data, colWidths=[1.6*inch, 1.4*inch, 1.1*inch, 0.9*inch, 2.0*inch])
    t_det.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#065f46')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f0fdf4')]),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(t_det)
    story.append(Spacer(1, 6))

    det_chart_path = "artifacts/presentation_charts/detector_chart.png"
    if os.path.exists(det_chart_path):
        story.append(Image(det_chart_path, width=5.2*inch, height=2.6*inch))

    story.append(Spacer(1, 4))
    story.append(Paragraph(
        "<b>Rigorous Interpretation:</b> ROC-AUC values near 0.50 demonstrate that HelixSign watermarked sequences cannot be discriminated "
        "from native <i>E. coli</i> CDS by k-mer frequency distributions or local convolutional filters on this dataset. "
        "This proves stealth within the capacity of these models, but does not claim universal mathematical unbreakability.",
        body_style
    ))

    # ---------------------------------------------------------
    # Section 5: Biological Integrity & Software Validation
    # ---------------------------------------------------------
    story.append(PageBreak())
    story.append(Paragraph("5. Biological Integrity & Software Validation", h1_style))
    story.append(Paragraph(
        "Steganographic capacity is meaningless if it disrupts protein function. HelixSign preserves 100% biological translation fidelity:",
        body_style
    ))

    bio_summary = [
        [Paragraph("<b>4,290 / 4,290</b><br/><font size=7 color='#64748b'>CDS Genome Invariance</font>", table_cell_bold),
         Paragraph("<b>0 Mismatches</b><br/><font size=7 color='#64748b'>NCBI Table 11 Translation</font>", table_cell_bold),
         Paragraph("<b>CAI >= 0.902</b><br/><font size=7 color='#64748b'>Host Translation Fitness</font>", table_cell_bold),
         Paragraph("<b><= 4 nt Run</b><br/><font size=7 color='#64748b'>Homopolymer Slip Limit</font>", table_cell_bold),
         Paragraph("<b>88 / 88 Pass</b><br/><font size=7 color='#64748b'>Automated Test Suite</font>", table_cell_bold)],
    ]
    t_bio = Table(bio_summary, colWidths=[1.4*inch, 1.4*inch, 1.4*inch, 1.4*inch, 1.4*inch])
    t_bio.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f1f5f9')),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 1, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_bio)
    story.append(Spacer(1, 8))

    story.append(Paragraph("<b>Formal Protein Invariance Assertion:</b>", h2_style))
    story.append(Paragraph("Translate(DNA_original) == Translate(DNA_stamped)  ==>  Mismatches = 0", eq_style))
    story.append(Spacer(1, 6))

    # ---------------------------------------------------------
    # Section 6: Mathematical Error Correction & Codec Framing
    # ---------------------------------------------------------
    story.append(Paragraph("6. Mathematical Error Correction & Codec Framing", h1_style))
    story.append(Paragraph(
        "To guarantee bit-for-bit interoperability between Person 3's ML subsystem and Person 2's TypeScript backend "
        "(<code>backend/src/core/ecc.ts</code>), the packet framing and Galois field parameters are frozen in Version 1.5.0:",
        body_style
    ))

    story.append(Paragraph("<b>A. Packet Framing & RS Bit Offset Invariant:</b>", h2_style))
    story.append(Paragraph(
        "The transmission packet prepends a 24-bit synchronization word (<code>0xF9AE45</code>) and a 16-bit CRC-8 protected header "
        "before the Reed-Solomon codeword. Consequently, RS symbol erasures must be calculated starting at bit 40, not bit 0:",
        body_style
    ))
    story.append(Paragraph("L_prefix = L_sync + L_header = 24 + 16 = 40 bits  ==>  i_RS = 40", eq_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph("symbol_erased[j] = True  iff  exists b in [0,7]: confidence[i_RS + 8*j + b] < 0.60", eq_style))
    story.append(Spacer(1, 6))

    story.append(Paragraph("<b>B. Galois Field & Reed-Solomon Code Parameters:</b>", h2_style))
    story.append(Paragraph(
        "Built over GF(256) with field primitive polynomial p(x) = x^8 + x^4 + x^3 + x^2 + 1 (0x11D = 285). "
        "Generator roots start at alpha^0 = 1 with primitive element alpha = 0x02: g(x) = prod_{i=0}^{nsym-1} (x - alpha^i). "
        "The errors-and-erasures decoding bound is strictly:",
        body_style
    ))
    story.append(Paragraph("2*t + e <= n - k = nsym", eq_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph(
        "For standard RS(16, 8) with nsym = 8 parity symbols, the code corrects up to 4 symbol errors (2*4 + 0 = 8), "
        "up to 8 symbol erasures (0 + 8 = 8), or simultaneous combinations such as 2 symbol errors + 4 symbol erasures (2*2 + 4 = 8).",
        body_style
    ))
    story.append(Spacer(1, 6))

    story.append(Paragraph("<b>C. Independently Verified Reference Test Vectors:</b>", h2_style))
    codec_vectors = [
        [Paragraph("Vector Target", table_header), Paragraph("Input Data Bytes", table_header), Paragraph("Parity Bytes (nsym=8)", table_header), Paragraph("Codeword Hex", table_header)],
        [Paragraph("ASCII 'HELIXSGN'", table_cell_bold), Paragraph("[72, 69, 76, 73, 88, 83, 71, 78]", table_cell), Paragraph("[210, 38, 24, 206, 247, 104, 155, 44]", table_cell), Paragraph("<code>48454c495853474ed22618cef7689b2c</code>", table_cell)],
        [Paragraph("Backend Test Payload", table_cell_bold), Paragraph("[0, 1, 127, 128, 171, 205, 239, 255]", table_cell), Paragraph("[72, 5, 68, 109, 13, 27, 115, 137]", table_cell), Paragraph("<code>00017f80abcdefff4805446d0d1b7389</code>", table_cell)],
    ]
    t_vec = Table(codec_vectors, colWidths=[1.5*inch, 1.8*inch, 1.9*inch, 1.8*inch])
    t_vec.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1e3a8a')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f8fafc')]),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(t_vec)
    story.append(Spacer(1, 10))

    # ---------------------------------------------------------
    # Section 7: Presentation Claims vs Academic Boundaries
    # ---------------------------------------------------------
    story.append(Paragraph("7. Presentation Claims & Academic Defense Strategy", h1_style))
    story.append(Paragraph(
        "To present with unassailable academic credibility, distinguish clearly between empirical discoveries, "
        "validated implementations, and pending full-system integration:",
        body_style
    ))

    claims_data = [
        [Paragraph("Result / Area", table_header), Paragraph("What You CAN Defend Rigorously", table_header), Paragraph("What You MUST NOT Overclaim", table_header)],
        [Paragraph("<b>Protein Identity</b>", table_cell), Paragraph("100% translational invariance across all 4,290 genes with zero mismatches.", table_cell), Paragraph("Do not claim arbitrary non-coding invariance (steganography is restricted to CDS).", table_cell)],
        [Paragraph("<b>Substitution Robustness</b>", table_cell), Paragraph("99.4% raw bit recovery at 0.5% noise; 92.9% at 5.0% noise (macro-averaged across 5 genes).", table_cell), Paragraph("Do not claim 100% recovery under substitutions without acknowledging that ECC is required.", table_cell)],
        [Paragraph("<b>Indel Degradation</b>", table_cell), Paragraph("Raw recovery drops to 45.0% at 0.1% indels and 5.8% at 2.0% indels due to downstream frameshifts.", table_cell), Paragraph("Do NOT claim indel robustness is solved; alignment and erasure mapping are implemented, but post-ECC recovery is pending live backend runs.", table_cell)],
        [Paragraph("<b>Detector Stealth</b>", table_cell), Paragraph("XGBoost (AUC 0.4775) and CNN (AUC 0.5032) operate near chance on HelixSign on this held-out split.", table_cell), Paragraph("Do not claim universal mathematical undetectability against unseen higher-order models.", table_cell)],
        [Paragraph("<b>Backend Integration</b>", table_cell), Paragraph("Interface specification v1.5.0 is frozen and validated with 10 passing contract tests and identical test vectors.", table_cell), Paragraph("Do not claim end-to-end multi-service deployment is complete until live cross-language tests execute.", table_cell)],
    ]
    t_claims = Table(claims_data, colWidths=[1.3*inch, 2.8*inch, 2.9*inch])
    t_claims.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#334155')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f8fafc')]),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_claims)

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF built successfully: {filename}")


if __name__ == "__main__":
    out_pdf = r"C:\Users\Kishan Shetty\Downloads\dnasteg\HelixSign\HelixSign_Presentation_Dossier.pdf"
    build_pdf(out_pdf)
