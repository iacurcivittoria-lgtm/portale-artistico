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

· Quando rimaniamo bloccati nel traffico, aspettando che il semaforo diventi verde.
· Quando trascorriamo mezz'ora in fila alle casse del supermercato.
· Quando aspettiamo un autobus o un treno che non arriva.
· Quando restiamo al telefono con un servizio clienti, passando da un operatore all'altro.
· Quando compiliamo moduli, ripetiamo gli stessi dati e dimostriamo continuamente di essere persone reali.
· Quando aspettiamo il caricamento di una pagina, un aggiornamento o un codice che non arriva.
· Quando scorriamo Instagram, TikTok o giochiamo sul cellulare, mentre il nostro tempo e la nostra attenzione diventano una risorsa economica per qualcun altro.

Sono tutte situazioni diverse, ma hanno qualcosa in comune: azioni e servizi che dovrebbero semplificarti la vita finiscono spesso per complicarla, chiedendoti tempo in cambio di qualcosa che dovrebbe essere immediato.

Le aziende che introducono chatbot e sistemi automatizzati per ridurre i costi non risparmiano soltanto sul personale: trasferiscono parte del lavoro e dell'attesa sugli utenti. Le casse automatiche non sempre velocizzano la spesa. Le procedure digitali non sempre semplificano la burocrazia. Le tecnologie nate per farci risparmiare tempo finiscono, talvolta, per consumarlo.

Il progresso tecnologico non coincide necessariamente con il progresso della qualità della nostra vita. Non sempre ciò che fa risparmiare tempo a un'azienda lo fa risparmiare anche a noi.

E così, mentre tutto dovrebbe diventare più veloce, noi continuiamo ad aspettare.

C'è però un aspetto ancora più contraddittorio in tutto questo: probabilmente hai dedicato più tempo a cercare di accedere a questa opera che a osservare molte altre opere d'arte. Davanti a un dipinto, a una fotografia o a un'installazione possiamo fermarci pochi secondi, per poi proseguire. Qui, invece, hai accettato di attendere, compilare, verificare e riprovare pur di ottenere qualcosa che ti era stato promesso.

Quanto tempo dedichiamo, spesso senza accorgercene, a questi meccanismi? E quanto ne rimane per ciò che potrebbe davvero arricchirci?

Dedichiamo minuti, ore e giornate a procedure che non abbiamo scelto, a piattaforme che competono per la nostra attenzione, a sistemi che ci chiedono continuamente di adattarci ai loro tempi. Eppure, quando si tratta di leggere un libro, visitare una mostra, imparare qualcosa, coltivare una passione o semplicemente fare ciò che desideriamo, diciamo spesso di non avere tempo.

Forse il problema non è soltanto la quantità di tempo che abbiamo a disposizione, ma il modo in cui viene occupato, sottratto, venduto e distribuito.

Il mio è un invito a riflettere sul valore del proprio tempo, ma anche su chi ne dispone, chi ne trae profitto e chi stabilisce le condizioni alle quali siamo costretti ad adattarci.

Hai trascorso minuti cercando di accedere a un'opera che ti era stata promessa come immediatamente disponibile. Hai accettato condizioni, superato verifiche, atteso caricamenti e seguito procedure.

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
