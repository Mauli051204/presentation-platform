export const getConversationLabel = (conversation, selfRole) => {
  const requirementTitle = conversation?.application?.requirement?.title || 'Conversation';
  const other = conversation?.participants?.find((p) => p.role !== selfRole);
  return other?.name ? `${other.name} — ${requirementTitle}` : requirementTitle;
};

export const getOtherParticipant = (conversation, selfRole) =>
  conversation?.participants?.find((p) => p.role !== selfRole) || null;
