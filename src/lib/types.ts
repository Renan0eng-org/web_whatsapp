interface MessageId {
  fromMe: boolean;
  remote: string;
  id: string;
  self: string;
  _serialized: string;
}

interface MessageFromTo {
  server: string;
  user: string;
  _serialized: string;
}

interface PollVotesSnapshot {
  pollVotes: any[]; // Caso haja votos de pesquisa, pode ser ajustado conforme o formato
}

interface Message {
  _data: {
    id: MessageId;
    rowId: number;
    viewed: boolean;
    body: string;
    type: string;
    t: number; // Timestamp em segundos
    from: MessageFromTo;
    to: MessageFromTo;
    ack: number;
    invis: boolean;
    star: boolean;
    kicNotified: boolean;
    isFromTemplate: boolean;
    pollOptions: any[]; // Se houver opções de pesquisa
    pollInvalidated: boolean;
    pollVotesSnapshot: PollVotesSnapshot;
    deprecatedMms3Url: string;
    latestEditMsgKey: any | null;
    latestEditSenderTimestampMs: any | null;
    mentionedJidList: any[]; // Lista de JIDs mencionados
    groupMentions: any[]; // Menções de grupos
    eventInvalidated: boolean;
    isVcardOverMmsDocument: boolean;
    isForwarded: boolean;
    hasReaction: boolean;
    viewMode: string;
    productHeaderImageRejected: boolean;
    lastPlaybackProgress: number;
    isDynamicReplyButtonsMsg: boolean;
    isCarouselCard: boolean;
    parentMsgId: any | null;
    callSilenceReason: any | null;
    isVideoCall: boolean;
    isMdHistoryMsg: boolean;
    stickerSentTs: number;
    isAvatar: boolean;
    lastUpdateFromServerTs: number;
    invokedBotWid: any | null;
    botTargetSenderJid: any | null;
    bizBotType: any | null;
    botResponseTargetId: any | null;
    botPluginType: any | null;
    botPluginReferenceIndex: any | null;
    botPluginSearchProvider: any | null;
    botPluginSearchUrl: any | null;
    botPluginSearchQuery: any | null;
    botPluginMaybeParent: boolean;
    botReelPluginThumbnailCdnUrl: any | null;
    botMsgBodyType: any | null;
    requiresDirectConnection: boolean;
    bizContentPlaceholderType: any | null;
    hostedBizEncStateMismatch: boolean;
    senderOrRecipientAccountTypeHosted: boolean;
    placeholderCreatedWhenAccountIsHosted: boolean;
    links: any[]; // Lista de links presentes na mensagem
  };
  id: MessageId;
  profilePictureUrl: string;
  ack: number;
  hasMedia: boolean;
  body: string;
  type: string;
  timestamp: number; // Timestamp da mensagem
  from: string;
  to: string;
  deviceType: string; // Tipo de dispositivo (ex.: "android")
  isForwarded: boolean;
  forwardingScore: number;
  isStatus: boolean;
  isStarred: boolean;
  fromMe: boolean;
  hasQuotedMsg: boolean;
  hasReaction: boolean;
  vCards: any[]; // Contatos no formato vCard
  mentionedIds: any[]; // IDs mencionados na mensagem
  groupMentions: any[]; // Menções em grupos
  isGif: boolean;
  links: any[]; // Links que podem estar na mensagem
  userData: User;
}

type Contact = {
  id: string;
  name: string;
  messages: Message[];
};

type User = {
  id: string;
  name: string;
  phone: string;
  profilePictureUrl: string;
};

type PrivateChat = {
  id: string;
  name: string;
  profilePictureUrl: string;
  status: "Online" | "Offline";
  messages: Message[];
};

type Task = {
  id: string;
  name: string;
  description: string;
  tags: string[];
  image: string | null;
  date: Date;
  column_id: string;
  index: number;
  user_create_id: string;
};

type CreateOrEditTask = {
  id?: string;
  name: string;
  description: string;
  tags: string[];
  image: string | null;
  date: Date;
  column_id: string;
  index: number;
  user_create_id?: string;
};

type Column = {
  id: string;
  name: string;
  tasks: Task[];
  index: number;
  user_create_id: string;
};

type Columns = {
  [key: string]: Column;
};
