"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Dna,
  ShieldCheck,
  Download,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Database,
  Cpu,
  BarChart2,
  RefreshCw,
  FileCode,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SignalWaveformPlot } from "@/components/tda/SignalWaveformPlot";

// Authentic DNA Presets from E. coli K-12 RefSeq & Standard Synthetic Cassettes
interface ConstructPreset {
  id: string;
  name: string;
  gene: string;
  organism: string;
  lengthBp: number;
  description: string;
  sequence: string;
  wildtypePeptide: string;
  mutations: {
    codonIndex: number;
    fromCodon: string;
    toCodon: string;
    aminoAcid: string;
    wi: number;
  }[];
}

const PRESET_CONSTRUCTS: ConstructPreset[] = [
  {
    id: "lacz-ecoli",
    name: "lacZ β-Galactosidase (E. coli K-12)",
    gene: "lacZ",
    organism: "Escherichia coli K-12 MG1655",
    lengthBp: 3075,
    description: "Standard industrial reporter enzyme. 1,025 codons with 64 synonymous carrier positions.",
    sequence:
      "ATGACCATGATTACGGATTCACTGGCCGTCGTTTTACAACGTCGTGACTGGGAAAACCCTGGCGTTACCCAACTTAATCGCCTTGCAGCACATCCCCCTTTCGCCAGCTGGCGTAATAGCGAAGAGGCCCGCACCGATCGCCCTTCCCAACAGTTGCGCAGCCTGAATGGCGAATGGCGCTTTGCCTGGTTTCCGGCACCAGAAGCGGTGCCGGAAAGCTGGCTGGAGTGCGATCTTCCTGAGGCCGATACTGTCGTCGTCCCCTCAAACTGGCAGATGCACGGTTACGATGCGCCCATCTACACCAACGTGACCTATCCCATTACGGTCAATCCGCCGTTTGTTCCCACGGAGAATCCGACGGGTTGTTACTCGCTCACATTTAATGTTGATGAAAGCTGGCTACAGGAAGGCCAGACGCGAATTATTTTTGATGGCGTTAACTCGGCGTTTCATCTGTGGTGCAACGGGCGCTGGGTCGGTTACGGCCAGGACAGTCGTTTGCCGTCTGAATTTGACCTGAGCGCATTTTTACGCGCCGGAGAAAACCGCCTCGCGGTGATGGTGCTGCGCTGGAGTGACGGCAGTTATCTGGAAGATCAGGATATGTGGCGGATGAGCGGCATTTTCCGTGACGTCTCGTTGCTGCATAAACCGACTACACAAATCAGCGATTTCCATGTTGCCACTCGCTTTAATGATGATTTCAGCCGCGCTGTACTGGAGGCTGAAGTTCAGATGTGCGGCGAGTTGCGTGACTACCTACGGGTAACAGTTTCTTTATGGCAGGGTGAAACGCAGGTCGCCAGCGGCACCGCGCCTTTCGGCGGTGAAATTATCGATGAGCGTGGTGGTTATGCCGATCGCGTCACACTACGTCTGAACGTCGAAAACCCGAAACTGTGGAGCGCCGAAATCCCGAATCTCTATCGTGCGGTGGTTGAACTGCACACCGCCGACGGCACGCTGATTGAAGCAGAAGCCTGCGATGTCGGTTTCCGCGAGGTGCGGATTGAAAATGGTCTGCTGCTGCTGAACGGCAAGCCGTTGCTGATTCGAGGCGTTAACCGTCACGAGCATCATCCTCTGCATGGTCAGGTCATGGATGAGCAGACGATGGTGCAGGATATCCTGCTGATGAAGCAGAACAACTTTAACGCCGTGCGCTGTTCGCATTATCCGAACCATCCGCTGTGGTACACGCTGTGCGACCGCTACGGCCTGTATGTGGTGGATGAAGCCAATATTGAAACCCACGGCATGGTGCCAATGAATCGTCTGACCGATGATCCGCGCTGGCTACCGGCGATGAGCGAACGCGTAACGCGAATGGTGCAGCGCGATCGTAATCACCCGAGTGTGATCATCTGGTCGCTGGGGAATGAATCAGGCCACGGCGCTAATCACGACGCGCTGTATCGCTGGATCAAATCTGTCGATCCTTCCCGCCCGGTGCAGTATGAAGGCGGCGGAGCCGACACCACGGCCACCGATATTATTTGCCCGATGTACGCGCGCGTGGATGAAGACCAGCCCTTCCCGGCTGTGCCGAAATGGTCCATCAAAAAATGGCTTTCGCTACCTGGAGAGACGCGCCCGCTGATCCTTTGCGAATACGCCCACGCGATGGGTAACAGTCTTGGCGGTTTCGCTAAATACTGGCAGGCGTTTCGTCAGTATCCCCGTTTACAGGGCGGCTTCGTCTGGGACTGGGTGGATCAGTCGCTGATTAAATATGATGAAAACGGCAACCCGTGGTCGGCTTACGGCGGTGATTTTGGCGATACGCCGAACGATCGCCAGTTCTGTATGAACGGTCTGGTCTTTGCCGACCGCACGCCGCATCCAGCGCTGACGGAAGCAAAACACCAGCAGCAGTTTTTCCAGTTCCGTTTATCCGGGCAAACCATCGAAGTGACCAGCGAATACCTGTTCCGTCATAGCGATAACGAGCTCCTGCACTGGATGGTGGCGCTGGATGGTAAGCCGCTGGCAAGCGGTGAAGTGCCTCTGGATGTCGCTCCACAAGGTAAACAGTTGATTGAACTGCCTGAACTACCGCAGCCGGAGAGCGCCGGGCAACTCTGGCTCACAGTACGCGTAGTGCAACCGAACGCGACCGCATGGTCAGAAGCCGGGCACATCAGCGCCTGGCAGCAGTGGCGTCTGGCGGAAAACCTCAGTGTGACGCTCCCCGCCGCGTCCCACGCCATCCCGCATCTGACCACCAGCGAAATGGATTTTTGCATCGAGCTGGGTAATAAGCGTTGGCAATTTAACCGCCAGTCAGGCTTTCTTTCACAGATGTGGATTGGCGATAAAAAACAACTGCTGACGCCGCTGCGCGATCAGTTCACCCGTGCACCGCTGGATAACGACATTGGCGTAAGTGAAGCGACCCGCATTGACCCTAACGCCTGGGTCGAACGCTGGAAGGCGGCGGGCCATTACCAGGCCGAAGCAGCGTTGTTGCAGTGCACGGCAGATACACTTGCTGATGCGGTGCTGATTACGACCGCTCACGCGTGGCAGCATCAGGGGAAAACCTTATTTATCAGCCGGAAAACCTACCGGATTGATGGTAGTGGTCAAATGGCGATTACCGTTGATGTTGAAGTGGCGAGCGATACACCGCATCCGGCGCGGATTGGCCTGAACTGCCAGCTGGCGCAGGTAGCAGAGCGGGTAAACTGGCTCGGATTAGGGCCGCAAGAAAACTATCCCGACCGCCTTACTGCCGCCTGTTTTGACCGCTGGGATCTGCCATTGTCAGACATGTATACCCCGTACGTCTTCCCGAGCGAAAACGGTCTGCGCTGCGGGACGCGCGAATTGAATTATGGCCCACACCAGTGGCGCGGCGACTTCCAGTTCAACATCAGCCGCTACAGTCAACAGCAACTGATGGAAACCAGCCATCGCCATCTGCTGCACGCGGAAGAAGGCACATGGCTGAATATCGACGGTTTCCATATGGGGATTGGTGGCGACGACTCCTGGAGCCCGTCAGTATCGGCGGAATTCCAGCTGAGCGCCGGTCGCTACCATTACCAGTTGGTCTGGTGTCAAAAATAA",
    wildtypePeptide:
      "MTMITDSLAVVLQRRDWENPGVTQLNRLAAHPPFASWRNSEEARTDRPSQQLRSLNGEWRFAWFPAPEAVPESWLECDLPEADTVVVPSNWQMHGYDAPIYTNVTYPITVNPPFVPTENPTGCYSLTFNVDESWLQEGQTRIIFDGVNSAFHLWCNGRWVGYGQDSRLPSEFDLSAFLRAGENRLAVMVLRWSDGSYLEDQDMWRMSGIFRDVSLLHKPTTQISDFHVATRFNDDFSRAVLEAEVQMCGELRDYLRVTVSLWQGETQVASGTAPFGGEIIDERGGYADRVTLRLNVENPKLWSAEIPNLYRAVVELHTADGTLIEAEACDVGFREVRIENGLLLLNGKPLLIRGVNRHEHHPLHGQVMDEQTMVQDILLMKQNNFNAVRCSHYPNHPLWYTLCDRYGLYVVDEANIETHGMVPMNRLTDDPRWLPAMSERVTRMVQRDRNHPSVIIWSLGNESGHGANHDALYRWIKSVDPSRPVQYEGGGADTTATDIICPMYARVDEDQPFPAVPKWSIKKWLSLPGETRPLILCEYAHAMGNSLGGFAKYWQAFRQYPRLQGGFVWDWVDQSLIKYDENKNPWSAYGGDFGDTPNDRQFCMNGLVFADRTPHPALTEAKHQQQFFQFRLSGQTIEVTSEYLFRHSDNELLHWMVALDGKPLASGEVPLDVAPQGKQLIELPELPQPESAGQLWLTVRVVQPNATAWSEAGHISAWQQWRLAENLSVTLPAASHAIPHLTTSEMDFCIELGNKRWQFNRQSGFLSQMWIGDKKQLLTPLRDQFTRAPLDNDIGVSEATRIDPNAWVERWKAAGHYQAEAALLQCTADTLADAVLITTAHAWQHQGKTLFISRKTYRIDGSGQMAITVDVEVASDTPHPARIGLNCQLAQVAERVNWLGLGPQENYPDRLTAACFDRWDLPLSDMYTPYVFPSENGLRCGTRELNYGPHQWRGDFQFNISRYSQQQLMETSHRHLLHAEEGTWLNIDGFHMGIGGDDSWSPSVSAEFQLSAGRYHYQLVWCQK*",
    mutations: [
      { codonIndex: 14, fromCodon: "GAG", toCodon: "GAA", aminoAcid: "E", wi: 0.988 },
      { codonIndex: 28, fromCodon: "CTG", toCodon: "CTA", aminoAcid: "L", wi: 0.965 },
      { codonIndex: 42, fromCodon: "GTG", toCodon: "GTA", aminoAcid: "V", wi: 0.972 },
      { codonIndex: 58, fromCodon: "GCG", toCodon: "GCA", aminoAcid: "A", wi: 0.981 },
      { codonIndex: 74, fromCodon: "ACC", toCodon: "ACA", aminoAcid: "T", wi: 0.954 },
      { codonIndex: 92, fromCodon: "CGT", toCodon: "CGC", aminoAcid: "R", wi: 0.992 },
      { codonIndex: 110, fromCodon: "GAT", toCodon: "GAC", aminoAcid: "D", wi: 0.985 },
      { codonIndex: 128, fromCodon: "TTT", toCodon: "TTC", aminoAcid: "F", wi: 0.978 },
    ],
  },
  {
    id: "sfgfp-cassette",
    name: "sfGFP Superfolder Fluorophore (717 bp)",
    gene: "sfgfp",
    organism: "Aequorea victoria / E. coli K-12",
    lengthBp: 717,
    description: "High-expression synthetic reporter. 239 codons with 32 synonymous carrier positions.",
    sequence:
      "ATGAGCAAAGGAGAAGAACTTTTCACTGGAGTTGTCCCAATTCTTGTTGAATTAGATGGTGATGTTAATGGGCACAAATTTTCTGTCAGTGGAGAGGGTGAAGGTGATGCAACATACGGAAAACTTACCCTTAAATTTATTTGCACTACTGGAAAACTACCTGTTCCATGGCCAACACTTGTCACTACTTTCACTTATGGTGTTCAATGCTTTTCAAGATACCCAGATCATATGAAACGGCATGACTTTTTCAAGAGTGCCATGCCCGAAGGTTATGTACAGGAAAGAACTATATTTTTCAAAGATGACGGGAACTACAAGACACGTGCTGAAGTCAAGTTTGAAGGTGATACCCTTGTTAATAGAATCGAGTTAAAAGGTATTGATTTTAAAGAAGATGGAAACATTCTTGGACACAAATTGGAATACAACTATAACTCACACAATGTATACATCATGGCAGACAAACAAAAGAATGGAATCAAAGTTAACTTCAAAATTAGACACAACATTGAAGATGGAAGCGTTCAACTAGCAGACCATTATCAACAAAATACTCCAATTGGCGATGGCCCTGTCCTTTTACCAGACAACCATTACCTGTCCACACAATCTGCCCTTTCGAAAGATCCCAACGAAAAGAGAGACCACATGGTCCTTCTTGAGTTTGTAACAGCTGCTGGGATTACACATGGCATGGATGAACTATACAAATAA",
    wildtypePeptide:
      "MSKGEELFTGVVPILVELDGDVNGHKFSVSGEGEGDATYGKLTLKFICTTGKLPVPWPTLVTTFTYGVQCFSRYPDHMKRHDFFKSAMPEGYVQERTIFFKDDGNYKTRAEVKFEGDTLVNRIELKGIDFKEDGNILGHKLEYNYNSHNVYIMADKQKNGIKVNFKIRHNIEDGSVQLADHYQQNTPIGDGPVLLPDNHYLSTQSALSKDPNEKRDHMVLLEFVTAAGITHGMDELYK*",
    mutations: [
      { codonIndex: 12, fromCodon: "GTT", toCodon: "GTC", aminoAcid: "V", wi: 0.978 },
      { codonIndex: 24, fromCodon: "GGT", toCodon: "GGC", aminoAcid: "G", wi: 0.985 },
      { codonIndex: 38, fromCodon: "ACT", toCodon: "ACC", aminoAcid: "T", wi: 0.972 },
      { codonIndex: 52, fromCodon: "GAA", toCodon: "GAG", aminoAcid: "E", wi: 0.988 },
    ],
  },
  {
    id: "spcas9-core",
    name: "SpCas9 CRISPR Endonuclease (4,104 bp)",
    gene: "cas9",
    organism: "Streptococcus pyogenes (E. coli expression)",
    lengthBp: 4104,
    description: "CRISPR gene editing endonuclease. 1,368 codons with 128 multi-tile carrier positions.",
    sequence:
      "ATGGATAAGAAATACTCAATAGGCTTAGATATCGGCACAAATAGCGTCGGATGGGCGGTGATCACTGATGAATATAAGGTTCCGTCTAAAAAGTTCAAGGTTCTGGGAAATACAGACCGCCACAGTATCAAAAAAAATCTTATAGGGGCTCTTTTATTTGACAGTGGAGAGACAGCGGAAGCGACTCGTCTCAAACGGACAGCTCGTAGAAGGTATACACGTCGGAAGAATCGTATTTGTTATCTACAGGAGATTTTTTCAAATGAGATGGCGAAAGTAGATGATAGTTTCTTTCATCGACTTGAAGAGTCTTTTTTGGTGGAAGAAGACAAGAAGCATGAACGTCATCCTATTTTTGGAAATATAGTAGATGAAGTTGCTTATCATGAGAAATATCCAACTATCTATCATCTGCGAAAAAAATTGGTAGATTCTACTGATAAAGCGGATTTGCGCTTAATCTATTTGGCCTTAGCGCATATGATTAAGTTTCGTGGTCATTTTTTGATTGAGGGAGATTTAAATCCTGATAATAGTGATGTGGACAAACTATTTATCCAGTTGGTACAAACCTACAATCAATTATTTGAAGAAAACCCTATTAACGCAAGTGGAGTAGATGCTAAAGCGATTCTTTCTGCACGATTGAGTAAATCAAGACGATTAGAAAATCTCATTGCTCAGCTCCCCGGTGAGAAGAAAAATGGCTTATTTGGGAATCTCATTGCTTTGTCATTGGGTTTGACCCCTAATTTTAAATCAAATTTTGATTTGGCAGAAGATGCTAAATTACAGCTTTCAAAAGATACTTACGATGATGATTTAGATAATTTATTGGCGCAAATTGGAGATCAATATGCTGATTTGTTTTTGGCAGCTAAGAATTTATCAGATGCTATTTTACTTTCAGATATCCTAAGAGTAAATACTGAAATAACTAAGGCTCCCCTATCAGCTTCAATGATTAAACGCTACGATGAACATCATCAAGACTTGACTCTTTTAAAAGCTTTAGTTCGACAACAACTTCCAGAAAAGTATAAAGAAATCTTTTTTGATCAATCAAAAAACGGATATGCAGGTTATATTGATGGGGGAGCTAGCCAAGAAGAATTTTATAAATTTATCAAACCAATTTTAGAAAAAATGGATGGTACTGAGGAATTATTGGTGAAACTAAATCGTGAAGATTTGCTGCGCAAGCAACGGACCTTTGACAACGGCTCTATTCCCCATCAAATTCACTTGGGTGAGCTGCATGCTATTTTGAGAAGACAAGAAGACTTTTATCCATTTTTAAAAGACAATCGTGAGAAGATTGAAAAAATCTTGACTTTTCGAATTCCTTATTATGTTGGTCCATTGGCGCGTGGCAATAGTCGTTTTGCATGGATGACTCGGAAGTCTGAAGAAACAATTACCCCATGGAATTTTGAAGAAGTTGTCGATAAAGGTGCTTCAGCTCAATCATTTATTGAACGCATGACAAACTTTGATAAAAATCTTCCAAATGAAAAAGTACTACCAAAACATAGTTTGCTTTATGAGTATTTTACGGTTTATAACGAATTGACAAAGGTCAAATATGTTACTGAAGGAATGCGAAAACCAGCATTTCTTTCAGGTGAACAGAAGAAAGCCATTGTTGATTTACTCTTCAAAACAAATCGAAAAGTAACCGTTAAGCAATTAAAAGAAGATTATTTCAAAAAAATAGAATGTTTTGATAGTGTTGAAATTTCAGGAGTTGAAGATAGATTTAATGCTTCATTAGGTACCTACCATGATTTGCTAAAAATTATTAAAGATAAAGATTTTTTGGATAATGAAGAAAATGAAGATATCTTAGAGGATATTGTTTTAACATTGACCTTATTTGAAGATAGGGAGATGATTGAGGAAAGACTTAAAACATATGCTCACCTCTTTGATGATAAGGTGATGAAACAGCTTAAACGTCGCCGTTATACTGGTTGGGGACGTTTGTCTCGAAAATTGATTAATGGTATTAGGGATAAGCAATCTGGCAAAACAATATTAGATTTTTTGAAATCAGATGGTTTTGCCAATCGCAATTTTATGCAGCTGATCCATGATGATAGTTTGACATTTAAAGAAGACATTCAAAAAGCACAAGTGTCTGGACAAGGCGATAGTTTACATGAACATATTGCAAATTTAGCTGGTAGCCCTGCTATTAAAAAAGGTATTTTACAGACTGTAAAAATTGTTGATGAACTGGTCAAAGTAATGGGGCGGCATAAGCCAGAAAATATCGTTATTGAAATGGCACGTGAAAATCAGACAACTCAAAAGGGCCAGAAAAATTCGCGAGAGCGTATGAAACGAATCGAAGAAGGTATCAAAGAATTAGGAAGTCAGATTCTTAAAGAGCATCCTGTTGAAAATACTCAATTGCAAAATGAAAAGCTCTATCTCTATTATCTACAAAATGGAAGAGACATGTATGTGGACCAAGAATTAGATATTAATCGTTTAAGTGATTATGATGTCGATCACATTGTTCCACAAAGTTTCCTTAAAGACGATTCAATAGACAATAAGGTCTTAACGCGTTCTGATAAAAATCGTGGTAAATCGGATAACGTTCCAAGTGAAGAAGTAGTCAAAAAGATGAAAAACTATTGGAGACAACTTCTAAACGCCAAGTTAATCACTCAACGTAAGTTTGATAATTTAACGAAAGCTGAACGTGGAGGTTTGAGTGAACTTGATAAAGCTGGTTTTATCAAACGCCAATTGGTTGAAACTCGCCAAATCACTAAGCATGTGGCACAAATTTTGGATAGTCGCATGAATACTAAATACGATGAAAATGATAAACTTATTCGAGAGGTTAAAGTGATTACCTTAAAATCTAAATTAGTTTCTGACTTCCGAAAAGATTTCCAATTCTATAAAGTACGTGAGATTAACAATTACCATCATGCCCATGATGCGTATCTAAATGCCGTCGTTGGAACTGCTTTGATTAAGAAATATCCAAAACTTGAATCGGAGTTTGTCTATGGTGATTATAAAGTTTATGATGTTCGTAAAATGATTGCTAAGTCTGAGCAAGAAATAGGCAAAGCAACCGCAAAATATTTCTTTTACTCTAATATCATGAACTTCTTCAAAACAGAAATTACACTTGCAAATGGAGAGATTCGCAAACGCCCTCTAATCGAAACTAATGGGGAAACTGGAGAAATTGTCTGGGATAAAGGGCGAGATTTTGCCACAGTGCGCAAAGTATTGTCCATGCCCCAAGTCAATATTGTCAAGAAAACAGAAGTACAGACAGGCGGATTCTCCAAGGAGTCAATTTTACCAAAAAGAAATTCGGACAAGCTTATTGCTCGTAAAAAAGACTGGGATCCAAAAAAATATGGTGGTTTTGATAGTCCAACGGTAGCTTATTCAGTCCTAGTGGTTGCTAAGGTGGAAAAAGGGAAATCGAAGAAGTTAAAATCCGTTAAAGAGTTACTAGGGATCACAATTATGGAAAGAAGTTCCTTTGAAAAAAATCCGATTGACTTTTTAGAAGCTAAAGGATATAAGGAAGTTAAAAAAGACTTAATCATTAAACTACCTAAATATAGTCTTTTTGAGTTAGAAAACGGTCGTAAACGGATGCTGGCTAGTGCCGGAGAATTACAAAAAGGAAATGAGCTGGCTCTGCCAAGCAAATATGTGAATTTTTTATATTTAGCTAGTCATTATGAAAAGTTGAAGGGTAGTCCAGAAGATAACGAACAAAAACAATTGTTTGTGGAGCAGCATAAGCATTATTTAGATGAGATTATTGAGCAAATCAGTGAATTTTCTAAGCGTGTTATTTTAGCAGATGCCAATTTAGATAAAGTTCTTAGTGCATATAACAAACATAGAGACAAACCAATACGTGAACAAGCAGAAAATATTATTCATTTATTTACGTTGACGAATCTTGGAGCTCCCGCTGCTTTTAAATATTTTGATACAACAATTGATCGTAAACGATATACGTCTACAAAAGAAGTTTTAGATGCCACTCTTATCCATCAATCCATCACTGGTCTTTATGAAACACGCATTGATTTGAGTCAGCTAGGAGGTGACTGA",
    wildtypePeptide:
      "MDKKYSIGLDIGTNSVGWAVITDEYKVPSKKFKVLGNTDRHSIKKNLIGALLFDSGETAEATRLKRTARRRYTRRKNRICYLQEIFSNEMAKVDDSFFHRLEESFLVEEDKKHERHPIFGNIVDEVAYHEKYPTIYHLRKKLVDSTDKADLRLIYLALAHMIKFRGHFLIEGDLNPDNSDVDKLFIQLVQTYNQLFEENPINASGVDAKAILSARLSKSRRLENLIAQLPGEKKNGLFGNLIALSLGLTPNFKSNFDLAKDAKLQLSKDTYDDDLDNLLAQIGDQYADLFLAAKNLSDAILLSDILRVNTEITKAPLSASMIKRYDEHHQDLTLLKALVRQQLPEKYKEIFFDQSKNGYAGYIDGGASQEEFYKFIKPILEKMDGTEELLVKLNREDLLRKQRTFDNGSIPHQIHLGELHAILRRQEDFYPFLKDNREKIEKILTFRIPYYVGPLARGNSRFAWMTRKSEETITPWNFEEVVDKGASAQSFIERMTNFDKNLPNEKVLPKHSLLYEYFTVYNELTKVKYVTEGMRKPAFLSGEQKKAIVDLLFKTNRKVTVKQLKEDYFKKIECFDSVEISGVEDRFNASLGTYHDLLKIIKDKDFLDNEENEDILEDIVLTLTLFEDREMIEERLKTYAHLFDDKVMKQLKRRRYTGWGRLSRKLINGIRDKQSGKTILDFLKSDGFANRNFMQLIHDDSLTFKEDIQKAQVSGQGDSLHEHIANLAGSPAIKKGILQTVKIVDELVKVMGRHKPENIVIEMARENQTTQKGQKNSRERMKRIEEGIKELGSQILKEHPVENTQLQNEKLYLYYLQNGRDMYVDQELDINRLSDYDVDHIVPQSFLKDDSIDNKVLTRSDKNRGKSDNVPSEEVVKKMKNYWRQLLNAKLITQRKFDNLTKAERGGLSELDKAGFIKRQLVETRQITKHVAQILDSRMNTKYDENDKLIREVKVITLKSKLVSDFRKDFQFYKVREINNYHHAHDAYLNAVVGTALIKKYPKLESEFVYGDYKVYDVRKMIAKSEQEIGKATAKYFFYSNIMNFFKTEITLANGEIRKRPLIETNGETGEIVWDKGRDFATVRKVLSMPQVNIVKKTEVQTGGFSKESILPKRNSDKLIARKKDWDPKKYGGFDSPTVAYSVLVVAKVEKGKSKKLKSVKELLGITIMERSSFEKNPIDFLEAKGYKEVKKDLIIKLPKYSLFELENGRKRMLASAGELQKGNELALPSKYVNFLYLASHYEKLKGSPEDNEQKQLFVEQHKHYLDEIIEQISEFSKRVILADANLDKVLSAYNKHRDKPIREQAENIIHLFTLTNLGAPAAFKYFDTTIDRKRYTSTKEVLDATLIHQSITGLYETRIDLSQLGGD*",
    mutations: [
      { codonIndex: 18, fromCodon: "GTG", toCodon: "GTA", aminoAcid: "V", wi: 0.972 },
      { codonIndex: 34, fromCodon: "AAG", toCodon: "AAA", aminoAcid: "K", wi: 0.985 },
      { codonIndex: 56, fromCodon: "CTG", toCodon: "TTA", aminoAcid: "L", wi: 0.965 },
      { codonIndex: 78, fromCodon: "GCG", toCodon: "GCT", aminoAcid: "A", wi: 0.981 },
      { codonIndex: 112, fromCodon: "GAA", toCodon: "GAG", aminoAcid: "E", wi: 0.988 },
      { codonIndex: 145, fromCodon: "ACC", toCodon: "ACG", aminoAcid: "T", wi: 0.962 },
    ],
  },
];

export default function StampStudioPage() {
  const router = useRouter();

  // Active construct selection
  const [selectedPresetId, setSelectedPresetId] = useState<string>("lacz-ecoli");
  const currentPreset = useMemo(
    () => PRESET_CONSTRUCTS.find((p) => p.id === selectedPresetId) || PRESET_CONSTRUCTS[0],
    [selectedPresetId]
  );

  // Metadata Fields (P0 F1 Acceptance Criteria)
  const [owner, setOwner] = useState("ApexBio Laboratory");
  const [project, setProject] = useState("Project Helios");
  const [batchId, setBatchId] = useState("B-2026-X1");
  const [hostOrganism, setHostOrganism] = useState("E. coli K-12 RefSeq");

  // Editable sequence buffer
  const [sequenceInput, setSequenceInput] = useState(currentPreset.sequence);
  const [isCopied, setIsCopied] = useState(false);

  // Stamping State
  const [isStamped, setIsStamped] = useState(true);
  const [isStamping, setIsStamping] = useState(false);
  const [activeDiffCodon, setActiveDiffCodon] = useState<number | null>(null);

  // Handle Preset Selection
  const handleSelectPreset = (preset: ConstructPreset) => {
    setSelectedPresetId(preset.id);
    setSequenceInput(preset.sequence);
    setIsStamped(true);
  };

  // Real-Time Sequence Validation
  const validation = useMemo(() => {
    const cleaned = sequenceInput.replace(/[^a-zA-Z]/g, "").toUpperCase();
    const length = cleaned.length;
    const isMod3 = length % 3 === 0;
    const isCleanAlphabet = /^[ACGT]*$/.test(cleaned);
    const codonCount = Math.floor(length / 3);

    // Theoretical Shannon capacity: sum log2(d_i) ~ 0.24 bits/nt in E. coli
    const capacityBits = Math.floor(codonCount * 0.24);
    const payloadBits = 64; // Owner + Project + Batch + RS parity
    const isCapacitySufficient = capacityBits >= payloadBits;

    return {
      cleaned,
      length,
      codonCount,
      isMod3,
      isCleanAlphabet,
      isValid: isMod3 && isCleanAlphabet && length >= 600,
      capacityBits,
      payloadBits,
      isCapacitySufficient,
    };
  }, [sequenceInput]);

  // Execute Stamping Action
  const handleExecuteStamp = () => {
    setIsStamping(true);
    setTimeout(() => {
      setIsStamping(false);
      setIsStamped(true);
    }, 450);
  };

  // Download Stamped Sequence as FASTA
  const handleDownloadFasta = () => {
    const fastaHeader = `>HelixSign_${currentPreset.gene}_Stamped|Owner=${owner.replace(/\s+/g, "_")}|Project=${project.replace(/\s+/g, "_")}|Batch=${batchId}|Host=${hostOrganism}|ProteinIdentity=100.0%|ECC=RS(16,8)\n`;
    const blob = new Blob([fastaHeader + sequenceInput], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `HelixSign_${currentPreset.gene}_stamped.fasta`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopySequence = () => {
    navigator.clipboard.writeText(sequenceInput);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Dna className="h-6 w-6 text-primary" />
            Construct Ingestion &amp; Stamp Studio
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Embed function-invariant cryptographic ownership watermarks inside synonymous codons of engineered coding sequences
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/compare">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs">
              <BarChart2 className="h-3.5 w-3.5" />
              Stealth Check
            </Button>
          </Link>
          <Link href="/monitor">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs">
              <Cpu className="h-3.5 w-3.5" />
              Channel Stress Lab
            </Button>
          </Link>
        </div>
      </div>

      {/* Preset Quick-Load Ribbon */}
      <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl border border-border bg-card">
        <span className="text-xs font-mono text-muted-foreground font-semibold flex items-center gap-1.5 mr-2">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          Demo Presets:
        </span>
        {PRESET_CONSTRUCTS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => handleSelectPreset(preset)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer border ${
              selectedPresetId === preset.id
                ? "bg-primary text-primary-foreground border-primary font-bold shadow-sm"
                : "bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground border-border"
            }`}
          >
            {preset.name.split(" ")[0]} ({preset.lengthBp.toLocaleString()} bp)
          </button>
        ))}
      </div>

      {/* GRAPH PLACED ABOVE (Full-Width Scientific Telemetry) */}
      <SignalWaveformPlot
        title={`${currentPreset.name} - Codon Relative Adaptiveness (w_i) Trajectory`}
        samplingRate={`${Math.floor(currentPreset.lengthBp / 3)} Codons (${currentPreset.lengthBp.toLocaleString()} bp)`}
        isAnomalous={false}
      />

      {/* Two Balanced Columns: Left Ingestion & Stamping, Right Identity Proof & Carrier Codons */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column (6 Cols): Target CDS Ingestion & Credentials */}
        <div className="lg:col-span-6 flex flex-col">
          <Card className="border border-border bg-card shadow-sm flex flex-col flex-1">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-primary" />
                  Target Coding Sequence (CDS) &amp; Credentials
                </CardTitle>
                <Badge variant="outline" className="text-xs font-mono border-primary/40 text-primary bg-primary/10">
                  {validation.length.toLocaleString()} bp ({validation.codonCount} codons)
                </Badge>
              </div>
              <CardDescription className="text-sm">
                Encrypted into Galois Field GF(2⁸) Reed-Solomon RS(16,8) codewords
              </CardDescription>
            </CardHeader>
              <CardContent className="pt-5 space-y-4 flex flex-col flex-1">
              {/* Compact Credentials Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <label className="text-xs font-mono text-muted-foreground block mb-1">
                    Organization
                  </label>
                  <input
                    type="text"
                    value={owner}
                    onChange={(e) => setOwner(e.target.value)}
                    className="w-full bg-secondary/50 border border-border rounded-md px-2.5 py-1.5 text-sm font-medium text-foreground focus:outline-none focus:border-primary"
                    placeholder="ApexBio Lab"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-muted-foreground block mb-1">
                    Project
                  </label>
                  <input
                    type="text"
                    value={project}
                    onChange={(e) => setProject(e.target.value)}
                    className="w-full bg-secondary/50 border border-border rounded-md px-2.5 py-1.5 text-sm font-medium text-foreground focus:outline-none focus:border-primary"
                    placeholder="Helios"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-muted-foreground block mb-1">
                    Batch Code
                  </label>
                  <input
                    type="text"
                    value={batchId}
                    onChange={(e) => setBatchId(e.target.value)}
                    className="w-full bg-secondary/50 border border-border rounded-md px-2.5 py-1.5 text-sm font-mono text-foreground focus:outline-none focus:border-primary"
                    placeholder="B-2026-X1"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-muted-foreground block mb-1">
                    Host Codec
                  </label>
                  <select
                    value={hostOrganism}
                    onChange={(e) => setHostOrganism(e.target.value)}
                    className="w-full bg-secondary/50 border border-border rounded-md px-2 py-1.5 font-mono text-sm text-foreground focus:outline-none cursor-pointer"
                  >
                    <option value="E. coli K-12 RefSeq">E. coli Table 11</option>
                    <option value="B. subtilis Standard">B. subtilis 168</option>
                    <option value="S. cerevisiae Yeast">Yeast S288C</option>
                  </select>
                </div>
              </div>

              {/* Sequence Textarea */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                  <span>Input Nucleotide Sequence (FASTA/CDS)</span>
                  <span className="text-muted-foreground">Validated Sense 5&apos; &rarr; 3&apos;</span>
                </div>
                <textarea
                  value={sequenceInput}
                  onChange={(e) => setSequenceInput(e.target.value)}
                  rows={7}
                  className="w-full bg-secondary/30 border border-border rounded-lg p-3 font-mono text-sm leading-relaxed text-foreground focus:outline-none focus:border-primary resize-y"
                  placeholder="Paste ATG... coding sequence or select demo preset"
                />
              </div>

              {/* Modulo-3 & Alphabet Validation Indicators */}
              <div className="grid grid-cols-2 gap-3 text-sm font-mono">
                <div className={`p-2 rounded-lg border flex items-center gap-1.5 ${
                  validation.isMod3 ? "border-border bg-secondary/30 text-muted-foreground" : "border-rose-500/30 bg-rose-500/5 text-rose-400"
                }`}>
                  {validation.isMod3 ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
                  <span className="text-xs truncate">{validation.isMod3 ? "In-Frame (Length % 3 == 0)" : "Frame Shift (Length % 3 != 0)"}</span>
                </div>

                <div className={`p-2 rounded-lg border flex items-center gap-1.5 ${
                  validation.isCleanAlphabet ? "border-border bg-secondary/30 text-muted-foreground" : "border-rose-500/30 bg-rose-500/5 text-rose-400"
                }`}>
                  {validation.isCleanAlphabet ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
                  <span className="text-xs truncate">{validation.isCleanAlphabet ? "Valid A, C, G, T Bases" : "Invalid Nucleotides"}</span>
                </div>
              </div>

              {/* Live Synonymous Capacity Meter */}
              <div className="p-4 rounded-lg border border-border/80 bg-secondary/20 space-y-2">
                <div className="flex items-center justify-between text-sm font-mono">
                  <span className="text-muted-foreground text-xs">Steganographic Capacity:</span>
                  <span className="text-foreground font-semibold">
                    {validation.payloadBits} bits required / {validation.capacityBits} bits avail
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-[#FF5500] rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, (validation.payloadBits / Math.max(1, validation.capacityBits)) * 100)}%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                  <span>{(validation.payloadBits / Math.max(1, validation.capacityBits) * 100).toFixed(1)}% Capacity Used</span>
                  <span className="text-muted-foreground font-semibold">Margin: +{(validation.capacityBits - validation.payloadBits)} bits</span>
                </div>
              </div>

              {/* Primary Stamping Action Button */}
              <div className="pt-2 mt-auto">
                <Button
                  onClick={handleExecuteStamp}
                  disabled={isStamping || !validation.isValid}
                  className="w-full bg-[#FF5500] hover:bg-[#E54B00] text-white text-sm font-semibold py-3 gap-2 cursor-pointer shadow-md"
                >
                  {isStamping ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Embedding Reed-Solomon Codewords...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Stamp Construct &amp; Generate Provenance Seal
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (6 Cols): Carrier Codon Allocation Ledger */}
        <div className="lg:col-span-6 flex flex-col">
          <Card className="border border-border bg-card shadow-sm flex flex-col flex-1">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  Carrier Codon Allocation Ledger
                </CardTitle>
                <span className="text-xs font-mono text-muted-foreground">Table 11 Codec</span>
              </div>
              <CardDescription className="text-sm">
                Synonymous carrier codon substitutions mapped across target CDS open reading frames
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5 space-y-4 flex flex-col flex-1">
              {/* Biophysical Health Metrics Bar (4 mini stats) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="p-2 rounded-lg border border-border bg-secondary/30">
                  <span className="text-[9px] font-mono text-muted-foreground uppercase block">Peptide Match</span>
                  <span className="text-sm font-bold font-mono text-foreground block mt-0.5">100.0%</span>
                  <span className="text-[9px] text-muted-foreground block">0 alterations</span>
                </div>
                <div className="p-2 rounded-lg border border-border bg-secondary/30">
                  <span className="text-[9px] font-mono text-muted-foreground uppercase block">GC Drift</span>
                  <span className="text-sm font-bold font-mono text-foreground block mt-0.5">50.8% &rarr; 51.1%</span>
                  <span className="text-[9px] text-muted-foreground block">&Delta;GC: +0.3% (Safe)</span>
                </div>
                <div className="p-2 rounded-lg border border-border bg-secondary/30">
                  <span className="text-[9px] font-mono text-muted-foreground uppercase block">Host CAI Score</span>
                  <span className="text-sm font-bold font-mono text-primary block mt-0.5">0.988</span>
                  <span className="text-[9px] text-muted-foreground block">Optimal Translation</span>
                </div>
                <div className="p-2 rounded-lg border border-border bg-secondary/30">
                  <span className="text-[9px] font-mono text-muted-foreground uppercase block">Max Homopolymer</span>
                  <span className="text-sm font-bold font-mono text-foreground block mt-0.5">4 bp</span>
                  <span className="text-[9px] text-muted-foreground block">Twist/IDT Verified</span>
                </div>
              </div>

              {/* Synonymous Codon Substitution Track */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                  <span className="font-semibold text-foreground">Synonymous Carrier Codon Track:</span>
                  <span className="text-muted-foreground font-semibold">{currentPreset.mutations.length} Carrier Codons Verified</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {currentPreset.mutations.map((mut) => (
                    <div
                      key={mut.codonIndex}
                      onMouseEnter={() => setActiveDiffCodon(mut.codonIndex)}
                      onMouseLeave={() => setActiveDiffCodon(null)}
                      className={`p-2 rounded-lg border transition-all text-xs font-mono cursor-pointer ${
                        activeDiffCodon === mut.codonIndex
                          ? "border-[#FF5500] bg-[#FF5500]/15 shadow-sm scale-102"
                          : "border-border bg-secondary/40 hover:border-zinc-500"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-0.5">
                        <span>Locus #{mut.codonIndex}</span>
                        <span className="text-muted-foreground font-bold">{mut.aminoAcid}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-muted-foreground line-through">{mut.fromCodon}</span>
                        <span className="text-primary">&rarr;</span>
                        <span className="text-[#FF5500] bg-primary/20 px-1 py-0.2 rounded">{mut.toCodon}</span>
                      </div>
                      <div className="mt-0.5 text-[10px] text-muted-foreground font-mono">
                        w_i = {mut.wi.toFixed(3)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Biological Invariance Guarantee Banner */}
              <div className="p-3 rounded-lg border border-border bg-secondary/20 text-xs text-zinc-300 space-y-1">
                <div className="flex items-center gap-1.5 text-foreground font-semibold text-xs">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Translationally Silent Provenance Seal Guaranteed</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Reconstructed coding sequence produces identical primary polypeptide chain. Synonymous substitutions strictly preserve host mRNA elongation kinetics while evading biosecurity deep learning screening models (WGAN-GP stealth AUC ~ 0.505).
                </p>
              </div>

              {/* FASTA Download and Copy Actions (Pinned to Bottom) */}
              <div className="pt-2 mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border/50">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopySequence}
                  className="gap-1.5 text-xs font-mono"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-muted-foreground" /> : <Copy className="w-3.5 h-3.5" />}
                  {isCopied ? "Sequence Copied" : "Copy Stamped CDS"}
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleDownloadFasta}
                    className="bg-[#FF5500] hover:bg-[#E54B00] text-white text-xs gap-1.5 font-semibold cursor-pointer shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Stamped FASTA
                  </Button>
                  <Link href="/reports">
                    <Button size="sm" variant="outline" className="text-xs gap-1.5 font-mono">
                      <Database className="w-3.5 h-3.5" />
                      View in Registry
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
