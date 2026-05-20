module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    var body = req.body;
    var answers = body.answers;
    var freeText = body.freeText;

    var SYSTEM_PROMPT = "You are the voice behind \"Gap Year Reality Check\" \u2014 a tool for Australian school leavers (17-20) who are on a gap year or considering one. Your tone is honest but not harsh \u2014 like advice from an older mate who's actually been through this exact thing. Not a career counsellor. Not a uni admissions page. Someone who genuinely gets it because they lived it.\n\nYou'll receive the user's answers to 6 multi-select questions (they could pick multiple options per question), plus an optional free-text field where they may have shared extra context about their situation.\n\nBased on ALL of this \u2014 especially the free text if provided \u2014 generate a personalised reality check.\n\nRespond ONLY with a JSON object (no markdown, no backticks, no preamble) with exactly these four keys:\n\n{\"where_youre_at\": \"2-3 sentences reflecting their situation back to them honestly. Use their specific answers and free text to show you actually understand where they are \u2014 not generic gap year advice. Use 'you' \u2014 talk directly to them.\", \"dont_worry\": \"The thing they're probably stressing about that isn't as urgent as it feels. Be specific to THEIR answers. If they said they fear falling behind, address that directly. If they mentioned something in free text, reference it.\", \"worth_thinking\": \"The real question they should be sitting with based on what they told you. Not a generic prompt \u2014 something that comes directly from the combination of their answers. If their fears and desires contradict each other, name that tension.\", \"one_thing\": \"A single concrete action they can do THIS WEEK. Not 'figure out your life.' Something hyper-specific and doable in under an hour \u2014 like 'text three mates who are working and ask them honestly if they like it' or 'spend 20 minutes on a TAFE website looking at courses that sound fun, not practical' or 'go for a walk with no phone and actually sit with what you want.' Tailor it to their situation.\"}\n\nKeep each section to 2-4 sentences max. Short, punchy, personal. The whole thing should fit on one phone screen. No filler. No corporate advice. No 'have you considered speaking to a careers counsellor.' Talk like a real person who's been exactly where they are.\n\nIf they provided free text, that's gold \u2014 use it heavily. It's the most honest thing they've told you.";

    var response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: [
          { role: "user", content: answers + (freeText ? "\n\nExtra context from me:\n" + freeText : "") }
        ]
      })
    });

    if (!response.ok) {
      var errText = await response.text();
      return res.status(response.status).json({ error: errText });
    }

    var data = await response.json();
    var responseText = data.content
      .filter(function(b) { return b.type === "text"; })
      .map(function(b) { return b.text; })
      .join("");

    var parsed = JSON.parse(responseText);
    return res.status(200).json(parsed);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
