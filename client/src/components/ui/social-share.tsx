import React from 'react';
import { 
  FacebookShareButton, FacebookIcon,
  TwitterShareButton, TwitterIcon,
  RedditShareButton, RedditIcon,
  WhatsappShareButton, WhatsappIcon,
  TelegramShareButton, TelegramIcon
} from 'react-share';
import { Button } from './button';
import { Share2 } from 'lucide-react';

interface SocialShareProps {
  url: string;
  title: string;
  description?: string;
  imageUrl?: string;
  size?: number;
  round?: boolean;
  compact?: boolean;
  className?: string;
}

export function SocialShare({
  url,
  title,
  description = '',
  imageUrl = '',
  size = 32,
  round = true, 
  compact = false,
  className = ''
}: SocialShareProps) {
  const [isExpanded, setIsExpanded] = React.useState(!compact);
  
  const toggleExpand = () => {
    if (compact) {
      setIsExpanded(!isExpanded);
    }
  };
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {compact && (
        <Button 
          size="sm" 
          variant="outline"
          onClick={toggleExpand}
          className="bg-white/80 backdrop-blur-sm text-gray-700 hover:text-black"
        >
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      )}
      
      {isExpanded && (
        <div className="flex space-x-2 items-center">
          <FacebookShareButton url={url} hashtag="#PokemonRaffle">
            <FacebookIcon size={size} round={round} />
          </FacebookShareButton>
          
          <TwitterShareButton url={url} title={title} via="PokemonRaffle">
            <TwitterIcon size={size} round={round} />
          </TwitterShareButton>
          
          <RedditShareButton url={url} title={title}>
            <RedditIcon size={size} round={round} />
          </RedditShareButton>
          
          <WhatsappShareButton url={url} title={`${title} - ${description}`}>
            <WhatsappIcon size={size} round={round} />
          </WhatsappShareButton>
          
          <TelegramShareButton url={url} title={`${title} - ${description}`}>
            <TelegramIcon size={size} round={round} />
          </TelegramShareButton>
        </div>
      )}
    </div>
  );
} 