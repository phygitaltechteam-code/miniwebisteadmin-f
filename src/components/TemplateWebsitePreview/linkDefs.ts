import React from 'react';
import {
  Phone, MessageCircle, Send, Mail, MapPin, Star, Play, Facebook, Instagram, Youtube, Linkedin, Globe,
  Link2, Twitter, Users, BookOpen, Calendar, ShoppingBag, Smartphone, Music, FileText, Image as ImageIcon,
} from 'lucide-react';
import { CardSectionKey } from '@/types/profile';

/** Link Store keys shown in the Links section, with their default label and icon */
export const LINK_DEFS: Array<{ key: string; label: string; Icon: React.ComponentType<{ className?: string }> }> = [
  { key: 'customLink', label: 'Custom Link', Icon: Link2 },
  { key: 'whatsappLinks', label: 'WhatsApp', Icon: MessageCircle },
  { key: 'emailLinks', label: 'Email', Icon: Mail },
  { key: 'callLinks', label: 'Call', Icon: Phone },
  { key: 'instagramLink', label: 'Instagram', Icon: Instagram },
  { key: 'facebookLink', label: 'Facebook', Icon: Facebook },
  { key: 'youTubeLink', label: 'YouTube', Icon: Youtube },
  { key: 'linkedinLink', label: 'LinkedIn', Icon: Linkedin },
  { key: 'twitter', label: 'Twitter / X', Icon: Twitter },
  { key: 'webSiteLink', label: 'Website', Icon: Globe },
  { key: 'location', label: 'Location', Icon: MapPin },
  { key: 'googleMyBussiness', label: 'Google Business', Icon: Star },
  { key: 'telegram', label: 'Telegram', Icon: Send },
  { key: 'whatsappGroup', label: 'WhatsApp Group', Icon: Users },
  { key: 'facebookGroup', label: 'Facebook Group', Icon: Users },
  { key: 'catalogue', label: 'Catalogue', Icon: BookOpen },
  { key: 'bookingLink', label: 'Booking', Icon: Calendar },
  { key: 'shopify', label: 'Shopify', Icon: ShoppingBag },
  { key: 'amazonLink', label: 'Amazon', Icon: ShoppingBag },
  { key: 'meshowLink', label: 'Meesho', Icon: ShoppingBag },
  { key: 'zomatoLink', label: 'Zomato', Icon: ShoppingBag },
  { key: 'swiggyLink', label: 'Swiggy', Icon: ShoppingBag },
  { key: 'uberLink', label: 'Uber', Icon: Link2 },
  { key: 'appStoreLink', label: 'App Store', Icon: Smartphone },
  { key: 'playStoreLink', label: 'Play Store', Icon: Play },
  { key: 'spotifyLink', label: 'Spotify', Icon: Music },
  { key: 'discordLink', label: 'Discord', Icon: MessageCircle },
  { key: 'slackLink', label: 'Slack', Icon: MessageCircle },
  { key: 'pdfLink', label: 'PDF', Icon: FileText },
  { key: 'videoLink', label: 'Video', Icon: Play },
  { key: 'imageLink', label: 'Image', Icon: ImageIcon },
  { key: 'goLink', label: 'Link', Icon: Link2 },
];

/** Preview section order when the builder has no saved sectionOrder */
export const PREVIEW_DEFAULT_SECTION_ORDER: CardSectionKey[] = ['links', 'about', 'products', 'payment', 'gallery', 'youtube'];

/** Brand colours for the footer link icons; other links use the theme colour */
export const LINK_BRAND_COLORS: Record<string, string> = {
  whatsappLinks: '#25D366',
  whatsappGroup: '#25D366',
  emailLinks: '#EA4335',
  callLinks: '#0EA5E9',
  instagramLink: '#E4405F',
  facebookLink: '#1877F2',
  facebookGroup: '#1877F2',
  youTubeLink: '#FF0000',
  linkedinLink: '#0A66C2',
  twitter: '#000000',
  telegram: '#229ED9',
  location: '#34A853',
  googleMyBussiness: '#4285F4',
  spotifyLink: '#1DB954',
  discordLink: '#5865F2',
  amazonLink: '#FF9900',
  zomatoLink: '#E23744',
  swiggyLink: '#FC8019',
};
