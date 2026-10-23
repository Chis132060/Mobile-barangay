// Bundled, network-free guidance. Does NOT claim to be a generative language model,
// and deliberately avoids inventing hours, fees, document requirements or ordinances.
const messages = {
  tgl: {
    hello: 'Kumusta! Ako si Ate Sora sa offline mode. Kaya kong sumagot sa karaniwang tanong tungkol sa serbisyo ng barangay. Para sa live records, kailangan ng internet.',
    document: 'Para sa dokumento ng barangay, karaniwang kailangan munang kumpirmahin ang iyong resident account, pumili ng uri ng dokumento at sundin ang requirements na ibibigay ng barangay. Hindi ko ma-verify offline ang eksaktong requirements, bayad o request status. Kumonekta sa internet bago magsumite.',
    office: 'Hindi ko ma-verify ang kasalukuyang oras ng barangay hall kapag offline. Tingnan ang opisyal na anunsyo o tumawag sa opisina kapag may koneksyon.',
    status: 'Offline ka ngayon kaya hindi ko makukuha ang live status ng iyong request, payment, verification o programa. Kumonekta at buksan ang Requests o Notifications.',
    rules: 'Ang eksaktong ordinansa at curfew ay nakadepende sa barangay at maaaring magbago. Hindi ako magbibigay ng oras o patakaran nang walang opisyal na source; i-check ang published announcements kapag online.',
    events: 'Hindi ko makita ang pinakabagong events o announcements nang offline. Kumonekta sa internet at buksan ang Updates.',
    emergency: 'Kung may agarang panganib o medical emergency, humingi agad ng tulong sa malapit na emergency services o barangay responder. Huwag umasa sa offline chat para sa emergency dispatch.',
    unknown: 'Offline ako ngayon. Kaya kong tumulong sa basic barangay FAQs, pero hindi ko masagot nang sigurado ang tanong na ito nang walang live AI at opisyal na datos. Kumonekta sa internet para sa mas kumpletong sagot.'
  },
  ceb: {
    hello: 'Kumusta! Ako si Ate Sora sa offline mode. Makatabang ko sa kasagarang pangutana bahin sa serbisyo sa barangay; kinahanglan ang internet para sa live records.',
    document: 'Para sa dokumento sa barangay, kinahanglan kasagarang verified nga resident account ug ang mga kinahanglanon sa hustong dokumento. Dili nako makumpirma offline ang eksaktong requirements, bayad o status. Pagkonekta sa internet una mosumite.',
    office: 'Dili nako makumpirma ang kasamtangang oras sa opisina sa barangay kung offline. Tan-awa ang opisyal nga pahibalo kung online.',
    status: 'Offline ka karon, busa dili nako makita ang live status sa request, bayad, verification o programa. Pag-online ug ablihi ang Requests o Notifications.',
    rules: 'Ang ordinansa ug curfew magdepende sa inyong barangay. Dili ko mohatag og eksaktong oras nga walay opisyal nga tinubdan. Tan-awa ang Updates kung online.',
    events: 'Dili nako makita ang bag-ong kalihokan ug pahibalo kung offline. Ablihi ang Updates kung naa nay internet.',
    emergency: 'Kung adunay kalit nga peligro o medical emergency, pangayo dayon og tabang sa duol nga emergency services o barangay responder.',
    unknown: 'Offline ko karon. Makatabang ko sa basic barangay FAQs, apan kinahanglan og internet ang live AI ug opisyal nga impormasyon.'
  },
  en: {
    hello: 'Hello! I am Ate Sora in offline mode. I can answer basic barangay service questions, but live records and full AI conversations need internet.',
    document: 'For barangay documents, you usually need an eligible resident account and the requirements for your chosen document. I cannot verify exact fees, forms, or request status offline. Connect before submitting.',
    office: 'I cannot verify current barangay office hours offline. Check official announcements or contact the office when connected.',
    status: 'You are offline, so I cannot retrieve your live request, payment, verification, or program status. Reconnect and check Requests or Notifications.',
    rules: 'Curfew and local ordinances depend on your barangay and may change. I cannot safely state specific rules without an official source. Check published announcements when connected.',
    events: 'I cannot retrieve current events or announcements offline. Reconnect and open Updates.',
    emergency: 'For immediate danger or a medical emergency, contact nearby emergency services or a barangay responder directly. This offline chat cannot dispatch help.',
    unknown: 'I am offline. I can answer basic barangay FAQs, but this question needs the live AI service or verified barangay data. Reconnect for a fuller answer.'
  }
};
export function offlineSoraReply(question, language = 'tgl') {
  const text = String(question ?? '').toLowerCase().trim();
  if (!text) return null;
  const dictionary = messages[language] || messages.tgl;
  const has = (pattern) => pattern.test(text);
  let key = 'unknown';
  if (has(/\b(emergency|ambulance|fire|sunog|sakuna|tabang|help me|accident|aksidente|police|pulis)\b/i)) key = 'emergency';
  else if (has(/\b(status|track|tracking|pending|approved|payment|bayad|bayaran|verification|verify|nasaan|asa na|kanus-a)\b/i)) key = 'status';
  else if (has(/\b(document|documents|clearance|certificate|certification|indigency|residency|requirements|requirement|dokumento|papeles|kuhag|kuha|apply|application|form)\b/i)) key = 'document';
  else if (has(/\b(hours|oras|office|bukas|abri|open|sarado|hall|opisina)\b/i)) key = 'office';
  else if (has(/\b(ordinance|ordinansa|curfew|noise|polisiya|policy|balaod|batas|rules)\b/i)) key = 'rules';
  else if (has(/\b(event|events|update|updates|announcement|anunsyo|balita|program|kalihokan|aktibidad)\b/i)) key = 'events';
  else if (has(/\b(hello|hi|hey|kumusta|kamusta|maayong|good morning|good afternoon|good evening)\b/i)) key = 'hello';
  return { answer: dictionary[key], category: key, offline: true };
}
