// Netlify Background Function: riceve l'indirizzo e invia la lettera dopo 10 minuti.
// In fase di prova invia SOLO alla casella TEST_EMAIL del proprietario dell'account Resend.

export const config = {
  path: "/api/invia-lettera",
  background: true,
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const letterText = `La tua esperienza artistica è terminata?\n\nGrazie per aver partecipato a questa esperienza artistica!\n\nTi ho sottratto alcuni minuti del tuo tempo, promettendoti di mostrarti un'opera. Eppure, quell'opera non l'hai mai vista. O forse sì.\n\nOgni giorno qualcuno, o qualcosa, ti sottrae il tuo tempo. Succede continuamente, spesso senza che tu te ne accorga:\n\n• Quando rimani bloccato nel traffico, aspettando che il semaforo diventi verde.\n• Quando trascorri mezz'ora in fila alle casse del supermercato.\n• Quando aspetti un autobus o un treno che non arriva.\n• Quando resti al telefono con un servizio clienti, passando da un operatore all'altro.\n• Quando compili moduli, ripeti gli stessi dati e dimostri continuamente di essere una persona reale.\n• Quando aspetti il caricamento di una pagina, un aggiornamento o un codice che non arriva.\n• Quando scorri Instagram, TikTok o giochi sul cellulare, mentre qualcuno guadagna proprio dal tempo che trascorri davanti allo schermo.\n\nSono tutte situazioni diverse, ma hanno qualcosa in comune: azioni e servizi che dovrebbero semplificarti la vita finiscono spesso per complicarla, chiedendoti tempo in cambio di qualcosa che dovrebbe essere immediato.\n\nLe aziende che introducono chatbot e sistemi automatizzati per ridurre i costi non risparmiano soltanto sul personale: trasferiscono parte del lavoro e dell'attesa sugli utenti. Le casse automatiche non sempre velocizzano la spesa. Le procedure digitali non sempre semplificano la burocrazia. Le tecnologie nate per farci risparmiare tempo finiscono, talvolta, per consumarlo.\n\nE intanto il tempo passa.\n\nFrancesco Petrarca, nel sonetto 272 del Canzoniere, scrive:\n\n«La vita fugge, et non s'arresta una hora»\n«et la morte vien dietro a gran giornate».\n\nLa vita scorre e non si arresta mai. Non possiamo metterla in pausa, recuperare i minuti perduti o chiedere un rimborso per le ore trascorse ad aspettare.\n\nIl mio è un invito a riflettere sul valore del proprio tempo.\n\nHai trascorso minuti cercando di accedere a un'opera che ti era stata promessa come immediatamente disponibile. Hai accettato condizioni, superato verifiche, atteso caricamenti e seguito procedure.\n\nE se sei arrivato fin qui, forse il tempo per aspettare lo hai trovato.\n\nMa quanto vale il tuo tempo? E soprattutto, chi decide come impiegarlo?\n\nGrazie per averlo dedicato alla mia opera. Anche se, forse, l'opera eri proprio tu.\n\nVittoria iacurci`;

export default async (req) => {
  if (req.method !== "POST") return;

  let payload;
  try {
    payload = await req.json();
  } catch {
    console.error("Richiesta email non valida: JSON non leggibile.");
    return;
  }

  const email = String(payload?.email || "").trim().toLowerCase();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    console.error("Richiesta email ignorata: formato non valido.");
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  const testMode = process.env.TEST_MODE !== "false";
  const testEmail = String(process.env.TEST_EMAIL || "").trim().toLowerCase();
  const from = testMode ? "Esperienza artistica <onboarding@resend.dev>" : process.env.EMAIL_FROM;

  if (!apiKey) {
    console.error("Variabile RESEND_API_KEY mancante.");
    return;
  }
  if (testMode && (!testEmail || email !== testEmail)) {
    console.error("Modalità test: invio consentito solo all'indirizzo TEST_EMAIL configurato.");
    return;
  }
  if (!testMode && !from) {
    console.error("Variabile EMAIL_FROM mancante.");
    return;
  }

  // La funzione resta attiva in background; il visitatore può continuare a navigare.
  await sleep(10 * 60 * 1000);

  const recipient = testMode ? testEmail : email;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [recipient],
      subject: "La tua esperienza artistica è terminata?",
      text: letterText,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("Errore Resend:", response.status, detail);
    throw new Error("Invio email non riuscito");
  }

  const result = await response.json();
  console.log("Lettera inviata. ID:", result.id);
};
