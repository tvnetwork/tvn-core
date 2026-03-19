export type SocialPlatform = 'twitter' | 'facebook' | 'linkedin';

export async function shareToSocialMedia(platform: SocialPlatform, message: string, url: string): Promise<{ success: boolean; error?: string }> {
  try {
    const encodedMessage = encodeURIComponent(message);
    const encodedUrl = encodeURIComponent(url);
    let shareUrl = '';

    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedMessage}&url=${encodedUrl}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      default:
        return { success: false, error: 'Unsupported platform' };
    }

    // Open share dialog in a new window
    window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=400');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to open share dialog' };
  }
}
