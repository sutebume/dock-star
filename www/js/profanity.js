/* Dock Star — display-name moderation.
   Shared by the browser (name entry) and the server (authoritative check),
   so a name rejected on one is rejected on the other.

   Leaderboard names are user-generated content shown to every player, which
   App Store Guideline 1.2 expects to be filtered. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;   /* server.js */
  else { root.DS = root.DS || {}; root.DS.profanity = api; }                /* browser */
})(typeof self !== 'undefined' ? self : this, function () {

  /* Starting word list. Extend as needed — matching is substring-based on a
     normalised form, so "sh1t", "s h i t" and "SHIT!" all collapse to "shit". */
  var BLOCKED = [
    'anal', 'anus', 'arse', 'ass', 'bastard', 'bitch', 'blowjob', 'boner',
    'boob', 'bollock', 'bugger', 'clit', 'cock', 'coon', 'crap', 'cum',
    'cunt', 'dick', 'dildo', 'douche', 'dyke', 'ejaculate', 'fag', 'faggot',
    'fuck', 'gook', 'handjob', 'hitler', 'homo', 'jizz', 'kike', 'nazi',
    'negro', 'nigga', 'nigger', 'nutsack', 'paki', 'pedo', 'penis', 'piss',
    'poop', 'porn', 'prick', 'pube', 'pussy', 'queer', 'rape', 'rapist',
    'retard', 'rimjob', 'scrotum', 'semen', 'sex', 'shit', 'slut', 'spic',
    'tits', 'titty', 'tranny', 'turd', 'twat', 'vagina', 'wank', 'whore'
  ];

  /* Words that legitimately contain a blocked substring. Checked first. */
  var ALLOWED = [
    'analog', 'analysis', 'analyst', 'assassin', 'assess', 'asset', 'assign',
    'assist', 'associate', 'assume', 'assure', 'bass', 'class', 'compass',
    'cassandra', 'cumulus', 'document', 'essex', 'glass', 'grass', 'kass',
    'mass', 'massive', 'pass', 'passenger',
    'scunthorpe', 'sussex', 'titan', 'titanic', 'title'
  ];

  var LEET = { '0':'o', '1':'i', '3':'e', '4':'a', '5':'s', '7':'t', '8':'b',
               '@':'a', '$':'s', '!':'i', '+':'t' };

  /* Lowercase, expand leetspeak, drop everything else, then collapse runs of
     the same letter so "fuuuck" and "f u c k" both reduce to "fuck". */
  function normalise(s) {
    var out = '';
    var lower = String(s || '').toLowerCase();
    for (var i = 0; i < lower.length; i++) {
      var c = lower[i];
      if (LEET[c]) c = LEET[c];
      if (c >= 'a' && c <= 'z') out += c;
    }
    return out.replace(/(.)\1{2,}/g, '$1$1');
  }

  /* Collapse every repeated run to one letter: "fuuuck" -> "fuck". Applied to
     the candidate AND the word list, so doubled letters in words like
     "bollock" still match. */
  function squash(s) { return s.replace(/(.)\1+/g, '$1'); }

  function isClean(name) {
    var n = normalise(name);
    if (!n) return true;

    /* Remove legitimate words first so "Bassmaster" is not caught by "ass". */
    var stripped = n;
    for (var a = 0; a < ALLOWED.length; a++) {
      stripped = stripped.split(ALLOWED[a]).join('');
    }
    var squashed = squash(stripped);

    for (var b = 0; b < BLOCKED.length; b++) {
      var w = BLOCKED[b];
      if (stripped.indexOf(w) !== -1) return false;
      /* Only compare collapsed forms when the collapsed word is still long
         enough to be distinctive: squash("ass") is "as", which appears in
         innocent words like "master". */
      var sw = squash(w);
      if (sw.length >= 4 && squashed.indexOf(sw) !== -1) return false;
    }
    return true;
  }

  return { isClean: isClean, normalise: normalise, blocked: BLOCKED };
});
