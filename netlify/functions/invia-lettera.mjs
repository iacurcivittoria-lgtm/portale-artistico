// Netlify Background Function: riceve l'indirizzo e invia la lettera dopo 3 minuti.
// In fase di prova invia SOLO alla casella TEST_EMAIL del proprietario dell'account Resend.

export const config = {
  path: "/api/invia-lettera",
  background: true,
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));



const letterText = `Grazie per aver partecipato a questa esperienza!

Ti ho sottratto alcuni minuti del tuo tempo promettendoti di mostrarti un’opera, eppure quell’opera non l’hai vista. 

O forse sì.

Ogni giorno qualcuno o qualcosa ruba il tuo tempo:

nel traffico, alle casse, aspettando i mezzi pubblici, al telefono con l’assistenza clienti, scrollando sui social…

Il tempo è diventato una merce: lo vendiamo lavorando, lo cediamo aspettando, lo regaliamo alle piattaforme. Siamo diventati efficienti nel perdere tempo e incapaci di dedicarlo a noi stessi. 

Le aziende ricorrono sempre di più a chatbot e a sistemi di risposta automatici per ridurre i costi. Ci hanno illusi che la tecnologia ci avrebbe fatto risparmiare tempo, ma delegando alle macchine il lavoro, le decisioni e persino il pensiero, si sta creando uno strato sociale incapace di pensare autonomamente, totalmente dipendente dalla tecnologia e con ridotta capacità di concentrazione.

Probabilmente hai dedicato più tempo a cercare di accedere a quest’opera che a osservare molte altre opere d’arte. Davanti a un dipinto, a una fotografia o a una scultura ci fermiamo pochi secondi, per poi proseguire. Qui invece hai “perso” tempo cercando di accedere a una promessa che non è stata mantenuta.

Quanto tempo dedichiamo a questi meccanismi? 

Eppure per fare ciò che davvero desideriamo, diciamo spesso di non avere tempo.

Il mio è un invito a riflettere sul valore del proprio tempo, ma anche su chi ne dispone e chi ne trae profitto.

E se sei arrivato fin qui, forse il tempo lo hai trovato.

Grazie per averlo dedicato alla mia opera. Anche se, forse, l’opera eri proprio tu.

Vittoria Iacurci`;


const letterHtml = `<!doctype html>
<html lang="it">
  <body style="margin: 0; padding: 24px; font-family: Arial, Helvetica, sans-serif; color: #222222; background: #ffffff;">
    <div style="max-width: 680px; margin: 0 auto; font-size: 16px;">
      <p style="margin: 0 0 18px 0; line-height: 1.65;">Grazie per aver partecipato a questa esperienza!</p>
      <p style="margin: 0 0 18px 0; line-height: 1.65;">Ti ho sottratto alcuni minuti del tuo tempo promettendoti di mostrarti un’opera, eppure quell’opera non l’hai vista.</p>
      <p style="margin: 0 0 18px 0; line-height: 1.65;">O forse sì.</p>
      <p style="margin: 0 0 18px 0; line-height: 1.65;">Ogni giorno qualcuno o qualcosa ruba il tuo tempo:</p>
      <p style="margin: 0 0 18px 0; line-height: 1.65;">nel traffico, alle casse, aspettando i mezzi pubblici, al telefono con l’assistenza clienti, scrollando sui social…</p>
      <p style="margin: 0 0 18px 0; line-height: 1.65;">Il tempo è diventato una merce: lo vendiamo lavorando, lo cediamo aspettando, lo regaliamo alle piattaforme. Siamo diventati efficienti nel perdere tempo e incapaci di dedicarlo a noi stessi.</p>
      <p style="margin: 0 0 18px 0; line-height: 1.65;">Le aziende ricorrono sempre di più a chatbot e a sistemi di risposta automatici per ridurre i costi. Ci hanno illusi che la tecnologia ci avrebbe fatto risparmiare tempo, ma delegando alle macchine il lavoro, le decisioni e persino il pensiero, si sta creando uno strato sociale incapace di pensare autonomamente, totalmente dipendente dalla tecnologia e con ridotta capacità di concentrazione.</p>
      <p style="margin: 0 0 18px 0; line-height: 1.65;">Probabilmente hai dedicato più tempo a cercare di accedere a quest’opera che a osservare molte altre opere d’arte. Davanti a un dipinto, a una fotografia o a una scultura ci fermiamo pochi secondi, per poi proseguire. Qui invece hai “perso” tempo cercando di accedere a una promessa che non è stata mantenuta.</p>
      <p style="margin: 0 0 18px 0; line-height: 1.65;">Quanto tempo dedichiamo a questi meccanismi?</p>
      <p style="margin: 0 0 18px 0; line-height: 1.65;">Eppure per fare ciò che davvero desideriamo, diciamo spesso di non avere tempo.</p>
      <p style="margin: 0 0 18px 0; line-height: 1.65;">Il mio è un invito a riflettere sul valore del proprio tempo, ma anche su chi ne dispone e chi ne trae profitto.</p>
      <p style="margin: 0 0 18px 0; line-height: 1.65;">E se sei arrivato fin qui, forse il tempo lo hai trovato.</p>
      <p style="margin: 0 0 18px 0; line-height: 1.65;">Grazie per averlo dedicato alla mia opera. Anche se, forse, l’opera eri proprio tu.</p>
      <p style="margin: 0 0 18px 0; line-height: 1.65;">Vittoria Iacurci</p>
    </div>
  </body>
</html>`;



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
      html: letterHtml,
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
