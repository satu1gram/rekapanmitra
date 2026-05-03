const text = "Bu Dyah Eka (Mitra SAP)";
const levelRegex = /\(?\b(?:mitra\s+)?(SE|SAP|AGEN\s+PLUS|AGEN|RESELLER)\b\)?/i;
const match = text.match(levelRegex);
console.log("Match:", match);
if (match) {
    console.log("Detected Tier:", match[1]);
    console.log("Cleaned Name:", text.replace(match[0], "").trim());
}
