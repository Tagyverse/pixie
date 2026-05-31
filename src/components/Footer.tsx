import { useState } from 'react';
import { Mail, Phone, MapPin, Facebook, Instagram, Twitter, Linkedin, Youtube, Heart, MessageSquare } from 'lucide-react';
import { usePublishedData } from '../contexts/PublishedDataContext';
import FeedbackModal from './FeedbackModal';

interface FooterConfig {
  is_visible: boolean;
  backgroundColor: string;
  textColor: string;
  headingColor: string;
  linkColor: string;
  linkHoverColor: string;
  accentColor: string;
  companyName: string;
  description: string;
  aboutUs?: string;
  email: string;
  phone: string;
  address: string;
  social: {
    facebook: string;
    instagram: string;
    twitter: string;
    linkedin: string;
    youtube: string;
  };
  quickLinks: Array<{ label: string; url: string }>;
  copyrightText: string;
  showQuickLinks: boolean;
  showSocial: boolean;
  showContact: boolean;
  showAboutUs?: boolean;
}

interface FooterProps {
  onNavigate?: (page: string) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  const { data: publishedData } = usePublishedData();
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  
  const config = publishedData?.footer_config as FooterConfig | null;

  if (!config || !config.is_visible) {
    return null;
  }

  const handleLinkClick = (url: string) => {
    if (url.startsWith('/')) {
      const page = url.substring(1);
      if (onNavigate) {
        onNavigate(page);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const socialIcons = config.social ? [
    { name: 'facebook', icon: Facebook, url: config.social.facebook, color: '#1877F2' },
    { name: 'instagram', icon: Instagram, url: config.social.instagram, color: '#E4405F' },
    { name: 'twitter', icon: Twitter, url: config.social.twitter, color: '#1DA1F2' },
    { name: 'linkedin', icon: Linkedin, url: config.social.linkedin, color: '#0A66C2' },
    { name: 'youtube', icon: Youtube, url: config.social.youtube, color: '#FF0000' },
  ].filter((social) => social.url) : [];

  return (
    <footer
      style={{
        backgroundColor: config.backgroundColor,
        color: config.textColor,
      }}
      className="py-12 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div className="lg:col-span-1">
            <h3
              style={{ color: config.headingColor }}
              className="text-2xl font-bold mb-4"
            >
              {config.companyName}
            </h3>
            <p className="text-sm leading-relaxed mb-4">{config.description}</p>
            
            {config.showAboutUs && config.aboutUs && (
              <div className="mt-6 pt-6 border-t" style={{ borderColor: config.accentColor + '30' }}>
                <h4
                  style={{ color: config.headingColor }}
                  className="text-sm font-semibold mb-3"
                >
                  Our Story
                </h4>
                <p className="text-xs leading-relaxed" style={{ color: config.textColor, opacity: 0.9 }}>
                  {config.aboutUs}
                </p>
              </div>
            )}
          </div>

          {config.showQuickLinks && Array.isArray(config.quickLinks) && config.quickLinks.length > 0 && (
            <div>
              <h4
                style={{ color: config.headingColor }}
                className="text-lg font-semibold mb-4"
              >
                Quick Links
              </h4>
              <ul className="space-y-2">
                {config.quickLinks.map((link, index) => (
                  <li key={index}>
                    <button
                      onClick={() => handleLinkClick(link.url)}
                      onMouseEnter={() => setHoveredLink(`link-${index}`)}
                      onMouseLeave={() => setHoveredLink(null)}
                      style={{
                        color: hoveredLink === `link-${index}` ? config.linkHoverColor : config.linkColor,
                      }}
                      className="text-sm transition-colors hover:underline"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {config.showContact && (
            <div>
              <h4
                style={{ color: config.headingColor }}
                className="text-lg font-semibold mb-4"
              >
                Contact Us
              </h4>
              <ul className="space-y-3">
                {config.email && (
                  <li className="flex items-start gap-2">
                    <Mail size={18} className="mt-0.5 flex-shrink-0" style={{ color: config.accentColor }} />
                    <a
                      href={`mailto:${config.email}`}
                      onMouseEnter={() => setHoveredLink('email')}
                      onMouseLeave={() => setHoveredLink(null)}
                      style={{
                        color: hoveredLink === 'email' ? config.linkHoverColor : config.textColor,
                      }}
                      className="text-sm transition-colors hover:underline"
                    >
                      {config.email}
                    </a>
                  </li>
                )}
                {config.phone && (
                  <li className="flex items-start gap-2">
                    <Phone size={18} className="mt-0.5 flex-shrink-0" style={{ color: config.accentColor }} />
                    <a
                      href={`tel:${config.phone}`}
                      onMouseEnter={() => setHoveredLink('phone')}
                      onMouseLeave={() => setHoveredLink(null)}
                      style={{
                        color: hoveredLink === 'phone' ? config.linkHoverColor : config.textColor,
                      }}
                      className="text-sm transition-colors hover:underline"
                    >
                      {config.phone}
                    </a>
                  </li>
                )}
                {config.address && (
                  <li className="flex items-start gap-2">
                    <MapPin size={18} className="mt-0.5 flex-shrink-0" style={{ color: config.accentColor }} />
                    <span className="text-sm">{config.address}</span>
                  </li>
                )}
              </ul>
            </div>
          )}

          {config.showSocial && socialIcons.length > 0 && (
            <div>
              <h4
                style={{ color: config.headingColor }}
                className="text-lg font-semibold mb-4"
              >
                Follow Us
              </h4>
              <div className="flex gap-3">
                {socialIcons.map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.name}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onMouseEnter={() => setHoveredLink(social.name)}
                      onMouseLeave={() => setHoveredLink(null)}
                      className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
                      style={{
                        backgroundColor: hoveredLink === social.name ? social.color : config.accentColor,
                        opacity: hoveredLink === social.name ? 1 : 0.8,
                      }}
                    >
                      <Icon size={20} style={{ color: '#FFFFFF' }} />
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div
          className="border-t pt-6 mt-6"
          style={{ borderColor: config.accentColor + '30' }}
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-center md:text-left">{config.copyrightText}</p>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowFeedback(true)}
                className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full border transition-all hover:scale-105"
                style={{ borderColor: config.accentColor, color: config.linkColor }}
              >
                <MessageSquare size={14} />
                Feedback
              </button>
              <p className="text-sm flex items-center gap-1">
                Made with <Heart size={16} style={{ color: config.accentColor }} fill={config.accentColor} /> for you
              </p>
            </div>
          </div>
          <div className="text-center mt-4 pt-4" style={{ borderColor: config.accentColor + '20', borderTopWidth: '1px' }}>
            <p className="text-xs" style={{ color: config.textColor, opacity: 0.7 }}>
              Crafted by <a href="https://tagyverse.com" target="_blank" rel="noopener noreferrer" className="font-semibold hover:opacity-100" style={{ color: config.linkColor }}>Tagyverse</a>
            </p>
          </div>
        </div>
      </div>

      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}
    </footer>
  );
}
