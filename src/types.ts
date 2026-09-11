export type CloseStyle = "circle" | "square" | "text";
export type BannerFit = "cover" | "contain";
export type PreviewStep = 1 | 2 | 3;

export interface VoucherItem {
  id: string;
  rewardText: string;
  rewardSubtitle?: string;
  rewardImage?: string;
  rewardTextColor?: string;
  rewardSubtitleColor?: string;
  code?: string;
  probability: number;
}

export interface PopupConfig {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;

  // General
  borderRadius: number;
  bgColor: string;
  fontFamily: string;
  closeColor: string;
  closeStyle: CloseStyle;
  closeBgColor: string;
  maxWidth: number;

  // Display mode: "popup" = overlay auto-open; "embed" = inline section
  displayMode: "popup" | "embed";
  autoShowDelay: number;

  // Right column — banner
  bannerImage: string;
  bannerFit: BannerFit;
  bannerPosition: string;

  // Left column — Step 1 scratch
  scratchTitle: string;
  scratchHint: string;
  scratchCoverImage: string;
  rewardImage: string;
  rewardSubtitle: string;
  rewardSubtitleColor: string;
  rewardSubtitleFontSize: number;
  rewardSubtitleFontFamily: string;
  rewardText: string;
  rewardTextColor: string;
  rewardTextFontSize: number;
  rewardTextFontFamily: string;
  rewardIconBefore: string;
  rewardIconAfter: string;
  scratchPercent: number;
  scratchTitleColor: string;
  claimButtonLabel: string;
  claimButtonColor: string;
  claimButtonColor2: string;
  claimButtonGradient: boolean;
  claimButtonTextColor: string;
  declineButtonLabel: string;
  showDeclineButton: boolean;

  // Multi-Voucher Randomization
  voucherRandomEnabled: boolean;
  vouchers: VoucherItem[];

  // Left column — Step 2 form
  formEmbedCode: string;
  formTitle: string;

  // Left column — Step 3 thanks
  thanksTitle: string;
  thanksMessage: string;
  thanksTextColor: string;
  thanksFontFamily: string;
  thanksButtonLabel: string;

  // Bubble (minimize-to-chat-widget)
  bubbleEnabled: boolean;
  bubblePosition: "bottom-left" | "bottom-right" | "top-left" | "top-right";
  bubbleText: string;
  bubbleBgColor: string;
  bubbleTextColor: string;
  bubbleSize: number;
  bubbleFontSize: number;
  bubbleFontFamily: string;
}

export interface PopupStore {
  popups: PopupConfig[];
}
