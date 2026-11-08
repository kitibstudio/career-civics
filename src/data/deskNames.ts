/** Map Civ yield jargon on cards to desk resource names (feedback §7). */
export function deskifyCardText(text: string): string {
  return text
    .replace(/\bGold\b/g, 'Fee')
    .replace(/\bScience\b/g, 'Competence')
    .replace(/\bProduction\b/g, 'Hours / output')
    .replace(/\bInfluence\b/g, 'Network')
    .replace(/\bCulture\b/g, 'Reputation')
    .replace(/\bHappiness\b/g, 'Wellbeing')
}
