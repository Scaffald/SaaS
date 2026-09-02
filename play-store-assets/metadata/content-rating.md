# Scaffald — Content rating (IARC) questionnaire

Play Console → App content → **Content rating**.

The questionnaire is filled once and generates ratings for every board at once
(ESRB, PEGI, USK, ClassInd, IARC generic). Answers below are what the app
actually does, not what produces the friendliest rating.

> Answering this dishonestly is not a form error, it is an enforcement matter.
> IARC re-rates automatically when answers change, and a rating obtained on
> false answers can be revoked along with the listing.

---

## Category

**Utility, Productivity, Communication or Other.**

Not a game, and not "Social" — Scaffald is a hiring marketplace. The
communication it carries is transactional (an employer enquiring about a
candidate), not social networking, and picking Social would pull in a
questionnaire branch about social features the app does not have.

---

## Answers

| Question | Answer |
|---|---|
| Violence — realistic or cartoon | **No** |
| Sexuality, nudity, suggestive content | **No** |
| Profanity or crude humour | **No** — none authored by the app; see the caveat below |
| Controlled substances — depicted, referenced, or encouraged | **No** |
| Gambling — simulated or real | **No** |
| Horror, fear, disturbing content | **No** |
| Bullying, harassment, hate speech (as app content) | **No** |
| **Users Interact** | **Yes** |
| **Shares Location** | **Yes** |
| Digital Purchases | **No** |
| Unrestricted internet access (browser) | **No** |
| User accounts required | **Yes** |

### Users Interact — Yes

Employers and candidates exchange messages in inquiry comment threads, and
community posts are visible to other users. That is interaction, plainly.

**#690 is resolved**, so this answer is now clean: a user can report a
community post, report an individual inquiry message, report a person, and
block a person — with blocking taking effect in both directions and reversible
from Settings. That is what Play's UGC policy expects of an app declaring
"Users Interact".

### Shares Location — Yes

Jobs are browsed on a live map, and worker location is visible to employers as
part of the product. Coarse and precise location are both declared in
[data-safety.md](data-safety.md).

### Profanity — No, with a caveat worth stating

The app authors no profanity. Users can type anything into a message or a
community post, which is true of every app with a text field; IARC asks about
content the *app* provides. The honest answer is No, and the real mitigation is
#690, not a different answer here.

---

## Expected outcome

Roughly **ESRB Everyone / PEGI 3 / USK 0**, with the interactive-elements
labels **"Users Interact"** and **"Shares Location"** attached. Those labels
appear on the listing regardless of the age rating.

Note this is *unrelated* to the **18+ target audience** set in the listing —
target audience is a separate declaration, driven here by employment law rather
than content. A low IARC rating and an 18+ target audience together are normal
and not a contradiction.

---

## Before submitting

- [x] #690 resolved, so "Users Interact: Yes" is answerable without a caveat
- [ ] Re-run the questionnaire if in-app purchases ship — Digital Purchases
      becomes Yes and the rating is regenerated
- [ ] Keep in step with [data-safety.md](data-safety.md); Shares Location must
      agree across both forms
