import {
  checkCombo,
  checkLineup,
  checkMemoryInput,
  checkRiddle,
  haggleOffer,
  mastermindScore,
  newHaggle,
  newMastermindCode,
  newMemorySequence,
  nextReactionZone,
  reactionHit,
  shuffled,
  type Suspect,
} from './logic';

export type MinigameType =
  | 'memory'
  | 'lock'
  | 'wire'
  | 'mastermind'
  | 'riddle'
  | 'reaction'
  | 'haggle'
  | 'lineup';

export interface MinigameConfig {
  type: MinigameType;
  title: string;
  desc: string;
  combo?: number[];
  riddle?: { q: string; a: string[]; c: number };
  lineup?: { clues: string; suspects: Suspect[] };
}

export interface MinigameHost {
  open(config: MinigameConfig, onSolved: () => void, onExit: () => void): void;
  close(): void;
  isOpen(): boolean;
}

const PAD_COLORS = ['#e05c5c', '#5cc0e0', '#e0c85c', '#7ce07c'];

/** DOM modal host for all 9 mini-games. Logic lives in logic.ts; this file is rendering + events only. */
export function createMinigameHost(
  root: HTMLElement,
  sfx: (id: 'coin' | 'fail' | 'blip') => void,
): MinigameHost {
  let open = false;
  let interval: ReturnType<typeof setInterval> | null = null;

  const titleEl = root.querySelector<HTMLElement>('#mg-title')!;
  const descEl = root.querySelector<HTMLElement>('#mg-desc')!;
  const bodyEl = root.querySelector<HTMLElement>('#mg-body')!;
  const actionsEl = root.querySelector<HTMLElement>('#mg-actions')!;

  function cleanup(): void {
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
  }

  function close(): void {
    cleanup();
    open = false;
    root.classList.add('hidden');
  }

  function button(label: string, onClick: () => void): HTMLButtonElement {
    const b = document.createElement('button');
    b.textContent = label;
    b.onclick = onClick;
    return b;
  }

  function openHost(config: MinigameConfig, onSolved: () => void, onExit: () => void): void {
    open = true;
    root.classList.remove('hidden');
    titleEl.textContent = config.title;
    descEl.textContent = config.desc;
    bodyEl.innerHTML = '';
    actionsEl.innerHTML = '';

    const solved = (): void => {
      close();
      onSolved();
    };
    const exit = (): void => {
      close();
      onExit();
    };

    switch (config.type) {
      case 'memory': {
        const seq = newMemorySequence(Math.random, 4 + Math.floor(Math.random() * 2));
        let step = 0;
        let showing = true;
        const pads = document.createElement('div');
        pads.className = 'mg-pads';
        PAD_COLORS.forEach((col, i) => {
          const b = button('', () => {
            if (showing) return;
            flash(i);
            if (!checkMemoryInput(seq, step, i)) {
              sfx('fail');
              step = 0;
              showing = true;
              setTimeout(playSeq, 700);
              return;
            }
            step += 1;
            if (step >= seq.length) solved();
          });
          b.style.background = col;
          pads.appendChild(b);
        });
        bodyEl.appendChild(pads);
        const flash = (i: number): void => {
          const b = pads.children[i] as HTMLElement;
          b.style.boxShadow = '0 0 18px #fff';
          setTimeout(() => {
            b.style.boxShadow = 'none';
          }, 280);
        };
        let idx = 0;
        const playSeq = (): void => {
          if (idx >= seq.length) {
            showing = false;
            return;
          }
          flash(seq[idx]!);
          sfx('blip');
          idx += 1;
          setTimeout(playSeq, 480);
        };
        setTimeout(playSeq, 500);
        break;
      }
      case 'lock': {
        const combo = config.combo!;
        const vals = [0, 0, 0];
        const dials = document.createElement('div');
        dials.className = 'mg-dials';
        const renders: (() => void)[] = [];
        for (let i = 0; i < 3; i += 1) {
          const d = document.createElement('div');
          const val = document.createElement('b');
          val.textContent = '0';
          const up = button('▲', () => {
            vals[i] = (vals[i]! + 1) % 10;
            val.textContent = String(vals[i]);
            sfx('blip');
          });
          const down = button('▼', () => {
            vals[i] = (vals[i]! + 9) % 10;
            val.textContent = String(vals[i]);
            sfx('blip');
          });
          d.append(up, val, down);
          dials.appendChild(d);
          renders.push(() => {
            val.textContent = String(vals[i]);
          });
        }
        bodyEl.appendChild(dials);
        actionsEl.appendChild(
          button('SUBMIT', () => {
            if (checkCombo(combo, vals)) solved();
            else sfx('fail');
          }),
        );
        break;
      }
      case 'wire': {
        const right = shuffled(PAD_COLORS, Math.random);
        let selL: HTMLButtonElement | null = null;
        let done = 0;
        const wrap = document.createElement('div');
        wrap.className = 'mg-wires';
        const leftCol = document.createElement('div');
        const rightCol = document.createElement('div');
        PAD_COLORS.forEach((col) => {
          const b = button('', () => {
            if (b.classList.contains('done')) return;
            leftCol.querySelectorAll('button').forEach((x) => x.classList.remove('sel'));
            b.classList.add('sel');
            selL = b;
            sfx('blip');
          });
          b.style.background = col;
          b.dataset.col = col;
          leftCol.appendChild(b);
        });
        right.forEach((col) => {
          const b = button('', () => {
            if (!selL || b.classList.contains('done')) return;
            if (wiresMatch(selL.dataset.col!, col)) {
              selL.classList.add('done');
              b.classList.add('done');
              selL = null;
              done += 1;
              sfx('coin');
              if (done >= PAD_COLORS.length) solved();
            } else {
              sfx('fail');
              selL.classList.remove('sel');
              selL = null;
            }
          });
          b.style.background = col;
          rightCol.appendChild(b);
        });
        wrap.append(leftCol, rightCol);
        bodyEl.appendChild(wrap);
        break;
      }
      case 'mastermind': {
        let code = newMastermindCode(Math.random);
        let tries = 6;
        const cur = [1, 1, 1, 1];
        const log: string[] = [];
        const dials = document.createElement('div');
        dials.className = 'mg-dials';
        for (let i = 0; i < 4; i += 1) {
          const d = document.createElement('div');
          const val = document.createElement('b');
          val.textContent = '1';
          const up = button('▲', () => {
            cur[i] = (cur[i]! % 6) + 1;
            val.textContent = String(cur[i]);
            sfx('blip');
          });
          const down = button('▼', () => {
            cur[i] = ((cur[i]! + 4) % 6) + 1;
            val.textContent = String(cur[i]);
            sfx('blip');
          });
          d.append(up, val, down);
          dials.appendChild(d);
        }
        const logEl = document.createElement('div');
        logEl.className = 'mg-log';
        bodyEl.append(dials, logEl);
        actionsEl.appendChild(
          button('TRY COMBINATION', () => {
            const score = mastermindScore(code, cur);
            log.unshift(`${cur.join('')} → ${'●'.repeat(score.exact)}${'○'.repeat(score.misplaced)}`);
            logEl.innerHTML = log.slice(0, 6).join('<br>');
            if (score.exact === 4) {
              solved();
              return;
            }
            tries -= 1;
            sfx('fail');
            if (tries <= 0) {
              code = newMastermindCode(Math.random);
              tries = 6;
              log.unshift('— code reshuffled —');
              logEl.innerHTML = log.slice(0, 6).join('<br>');
            }
          }),
        );
        break;
      }
      case 'riddle': {
        const r = config.riddle!;
        r.a.forEach((ans, i) => {
          actionsEl.appendChild(
            button(ans, () => {
              if (checkRiddle(r.c, i)) solved();
              else sfx('fail');
            }),
          );
        });
        break;
      }
      case 'reaction': {
        let pos = 0;
        let dir = 1;
        let hits = 0;
        let zone = { left: 30 + Math.random() * 40, width: 16 };
        const track = document.createElement('div');
        track.className = 'mg-track';
        const zoneEl = document.createElement('div');
        zoneEl.className = 'mg-zone';
        const mark = document.createElement('div');
        mark.className = 'mg-mark';
        track.append(zoneEl, mark);
        bodyEl.appendChild(track);
        const place = (): void => {
          zoneEl.style.left = `${zone.left}%`;
          zoneEl.style.width = `${zone.width}%`;
        };
        place();
        interval = setInterval(() => {
          pos += dir * 2.2;
          if (pos > 100) {
            pos = 100;
            dir = -1;
          }
          if (pos < 0) {
            pos = 0;
            dir = 1;
          }
          mark.style.left = `${pos}%`;
        }, 16);
        const logEl = document.createElement('div');
        logEl.className = 'mg-log';
        bodyEl.appendChild(logEl);
        actionsEl.appendChild(
          button('STOP', () => {
            if (reactionHit(pos, zone.left, zone.width)) {
              hits += 1;
              sfx('coin');
              logEl.textContent = `Hit ${hits}/3`;
              zone = nextReactionZone(Math.random, zone.width);
              place();
              if (hits >= 3) solved();
            } else {
              sfx('fail');
              logEl.textContent = 'Missed — stay sharp.';
            }
          }),
        );
        break;
      }
      case 'haggle': {
        let state = newHaggle(Math.random);
        const render = (msg: string): void => {
          descEl.textContent = `${msg} (Rounds left: ${state.rounds})`;
          actionsEl.innerHTML = '';
          [60, 75, 90].forEach((offer) => {
            actionsEl.appendChild(
              button(`Offer $${offer}`, () => {
                const r = haggleOffer(state, offer);
                state = r.state;
                if (r.accepted) {
                  solved();
                  return;
                }
                sfx('fail');
                if (r.finalPrice !== null) {
                  render(`Final take-it-or-leave-it: $${r.finalPrice}.`);
                  actionsEl.innerHTML = '';
                  actionsEl.appendChild(button(`Accept $${r.finalPrice}`, () => solved()));
                  actionsEl.appendChild(button('Walk away', exit));
                } else {
                  render('"You wound me! ...but fine, keep talking."');
                }
              }),
            );
          });
        };
        render('The vendor presents a Golden Watch. "One hundred dollars — or make me an offer."');
        break;
      }
      case 'lineup': {
        const l = config.lineup!;
        descEl.textContent = l.clues;
        l.suspects.forEach((s, i) => {
          actionsEl.appendChild(
            button(s.label, () => {
              if (checkLineup(l.suspects, i)) solved();
              else sfx('fail');
            }),
          );
        });
        break;
      }
    }

    actionsEl.appendChild(button('Leave', exit));
  }

  return {
    open: openHost,
    close,
    isOpen: () => open,
  };
}
