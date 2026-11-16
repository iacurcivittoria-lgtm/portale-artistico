// Netlify Background Function: riceve l'indirizzo e invia la lettera dopo 3 minuti.
// In fase di prova invia SOLO alla casella TEST_EMAIL del proprietario dell'account Resend.

export const config = {
  path: "/api/invia-lettera",
  background: true,
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));


const letterText = `Grazie per aver partecipato a questa esperienza!

Ti ho sottratto alcuni minuti del tuo tempo, promettendoti di mostrarti un'opera. Eppure, quell'opera non l'hai mai vista. O forse sì.

Ogni giorno qualcuno, o qualcosa, ti sottrae il tuo tempo. Succede continuamente, spesso senza che tu te ne accorga:

Perdiamo tempo nel traffico, in coda, aspettando i mezzi pubblici, parlando con l'assistenza clienti o aspettando che siti e applicazioni funzionino. Persino i social finiscono per trattenere la nostra attenzione.

Le aziende ricorrono sempre più a chatbot e sistemi automatici per ridurre i costi, ma spesso finiscono per trasferire sugli utenti il lavoro e l'attesa.

Non sempre ciò che fa risparmiare tempo a un'azienda lo fa risparmiare anche a noi.

E così, mentre tutto dovrebbe diventare più veloce, noi continuiamo ad aspettare.

Probabilmente hai dedicato più tempo a cercare di accedere a quest’opera che a osservare molte altre opere d'arte. Davanti a un dipinto, a una fotografia o a una scultura ci fermiamo pochi secondi, per poi proseguire. Qui invece hai trascorso minuti accettando condizioni, superando verifiche, seguendo procedure infinite.

Quanto tempo dedichiamo a questi meccanismi? E quanto ne rimane per ciò che potrebbe davvero arricchirci?

Dedichiamo ore a procedure che non abbiamo scelto, a piattaforme che competono per la nostra attenzione. Eppure, quando si tratta di fare ciò che davvero desideriamo, diciamo spesso di non avere tempo.

Il mio è un invito a riflettere sul valore del proprio tempo, ma anche su chi ne dispone e chi ne trae profitto.

E se sei arrivato fin qui, forse il tempo per aspettare lo hai trovato.

Ma quanto vale il tuo tempo? E soprattutto, chi decide come impiegarlo?

Grazie per averlo dedicato alla mia opera. Anche se, forse, l'opera eri proprio tu.

Vittoria Iacurci`;


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
  await sleep(3 * 60 * 1000);

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
