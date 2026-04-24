import { format } from 'date-fns';

export function processChampionshipChange(championship, match, show, currentDate) {
  const winnerId = match.winnerId;
  const currentChamp = Array.isArray(championship.currentChampion)
    ? championship.currentChampion
    : championship.currentChampion ? [championship.currentChampion] : [];

  const winnerIds = Array.isArray(winnerId) ? winnerId : winnerId ? [winnerId] : [];
  const isChange = winnerIds.length > 0 && !arraysEqual(currentChamp.sort(), winnerIds.sort());
  const isDefense = winnerIds.length > 0 && arraysEqual(currentChamp.sort(), winnerIds.sort());

  const dateStr = format(currentDate, 'yyyy-MM-dd');
  const history = [...(championship.history || [])];

  if (isChange) {
    // Close the current reign
    if (history.length > 0 && !history[history.length - 1].lostAt) {
      const lastReign = { ...history[history.length - 1] };
      lastReign.lostAt = { showId: show.id, showName: show.name, date: dateStr };
      const wonDate = new Date(lastReign.wonAt.date);
      lastReign.reignLengthDays = Math.round((currentDate - wonDate) / (1000 * 60 * 60 * 24));
      history[history.length - 1] = lastReign;
    }

    // Add new reign
    const newReign = {
      reignNumber: history.length + 1,
      championId: winnerIds,
      championName: match.winnerNames || 'Unknown',
      wonAt: { showId: show.id, showName: show.name, date: dateStr },
      lostAt: null,
      defenses: 0,
      reignLengthDays: null,
    };
    history.push(newReign);

    return {
      ...championship,
      currentChampion: winnerId,
      dateWon: dateStr,
      history,
      prestigeLevel: Math.max(1, championship.prestigeLevel - 0.2),
    };
  }

  if (isDefense) {
    // Increment defense count on the current reign
    if (history.length > 0 && !history[history.length - 1].lostAt) {
      const lastReign = { ...history[history.length - 1] };
      lastReign.defenses = (lastReign.defenses || 0) + 1;
      history[history.length - 1] = lastReign;
    }
    return {
      ...championship,
      history,
      prestigeLevel: Math.min(10, championship.prestigeLevel + 0.1),
    };
  }

  return championship;
}

function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
}

export function getChampionNames(championship, roster) {
  if (!championship.currentChampion) return null;
  const ids = Array.isArray(championship.currentChampion)
    ? championship.currentChampion
    : [championship.currentChampion];
  return ids.map(id => roster.find(t => t.id === id)?.name || 'Unknown').join(' & ');
}
