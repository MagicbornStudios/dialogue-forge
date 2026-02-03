import { z } from 'zod';

// Hero Banner Template
export const heroBannerSchema = z.object({
  mainTitle: z.string().default("Your Title Here"),
  subtitle: z.string().optional(),
  backgroundImage: z.string().optional(),
  primaryColor: z.string().default("#3b82f6"),
  fontFamily: z.string().default("system-ui"),
});

export type HeroBannerProps = z.infer<typeof heroBannerSchema>;

export const HeroBanner: React.FC<HeroBannerProps> = ({
  mainTitle,
  subtitle,
  backgroundImage,
  primaryColor,
  fontFamily,
}) => {
  return (
    <div style={{ 
      backgroundColor: primaryColor,
      width: 1920,
      height: 1080,
      fontFamily,
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      {/* Background Image */}
      {backgroundImage && (
        <img
          src={backgroundImage}
          alt="Background"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      )}
      
      {/* Text Content */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        textAlign: 'center',
        padding: '40px',
      }}>
        {mainTitle && (
          <h1 style={{
            fontSize: '48px',
            fontWeight: 'bold',
            margin: 0,
            color: '#ffffff',
            textShadow: '0px 2px 4px rgba(0,0,0,0.5)',
          }}>
            {mainTitle}
          </h1>
        )}
        {subtitle && (
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'normal',
            margin: 0,
            marginTop: '10px',
            color: '#ffffff',
            textShadow: '0px 2px 4px rgba(0,0,0,0.3)',
          }}>
            {subtitle}
          </h2>
        )}
      </div>
    </div>
  );
};

// Lower Third Template
export const lowerThirdSchema = z.object({
  title: z.string().default("Title"),
  subtitle: z.string().optional(),
  logoImage: z.string().optional(),
  backgroundColor: z.string().default("#000000"),
  textColor: z.string().default("#ffffff"),
});

export type LowerThirdProps = z.infer<typeof lowerThirdSchema>;

export const LowerThird: React.FC<LowerThirdProps> = ({
  title,
  subtitle,
  logoImage,
  backgroundColor,
  textColor,
}) => {
  return (
    <div style={{
      backgroundColor,
      width: 1920,
      height: 1080,
      fontFamily: 'Arial',
      color: textColor,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      alignItems: 'center',
      padding: '60px 40px',
    }}>
      {/* Logo Area */}
      {logoImage && (
        <img
          src={logoImage}
          alt="Logo"
          style={{
            width: '80px',
            height: '80px',
            objectFit: 'contain',
            marginRight: '20px',
          }}
        />
      )}
      
      {/* Text Area */}
      <div style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        {title && (
          <h1 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            margin: 0,
            textAlign: 'left',
          }}>
            {title}
          </h1>
        )}
        {subtitle && (
          <h2 style={{
            fontSize: '18px',
            fontWeight: 'normal',
            margin: 0,
            marginTop: '8px',
            textAlign: 'left',
          }}>
            {subtitle}
          </h2>
        )}
      </div>
    </div>
  );
};

// Social Media Template (16:9)
export const socialMediaSchema = z.object({
  title: z.string().default("Your Title"),
  description: z.string().optional(),
  backgroundImage: z.string().optional(),
  userAvatar: z.string().optional(),
});

export type SocialMediaProps = z.infer<typeof socialMediaSchema>;

export const SocialMedia: React.FC<SocialMediaProps> = ({
  title,
  description,
  backgroundImage,
  userAvatar,
}) => {
  return (
    <div style={{
      width: 1080,
      height: 608,
      backgroundColor: '#ffffff',
      fontFamily: 'Arial',
      color: '#000000',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Background */}
      {backgroundImage && (
        <img
          src={backgroundImage}
          alt="Background"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      )}
      
      {/* Content Overlay */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        padding: '20px',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), rgba(0,0,0,0.3))',
      }}>
        {/* User Avatar */}
        {userAvatar && (
          <img
            src={userAvatar}
            alt="User Avatar"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid white',
            }}
          />
        )}
        
        {/* Text Content */}
        <div style={{
          flex: 1,
          justifyContent: 'center',
        }}>
          {title && (
            <h1 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              margin: 0,
              color: '#ffffff',
              textShadow: '0px 1px 2px rgba(0,0,0,0.5)',
            }}>
              {title}
            </h1>
          )}
          {description && (
            <p style={{
              fontSize: '16px',
              fontWeight: 'normal',
              margin: 0,
              color: '#ffffff',
              lineHeight: 1.4,
              textShadow: '0px 1px 2px rgba(0,0,0,0.5)',
            }}>
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// Blank Scene Template
export const blankSceneSchema = z.object({
  backgroundColor: z.string().default("#1a1a2a"),
});

export type BlankSceneProps = z.infer<typeof blankSceneSchema>;

export const BlankScene: React.FC<BlankSceneProps> = ({
  backgroundColor,
}) => {
  return (
    <div style={{
      width: 1920,
      height: 1080,
      backgroundColor,
    }}>
      {/* Empty canvas with drag indicator */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        color: 'rgba(255,255,255,0.2)',
        fontSize: '18px',
        textAlign: 'center',
        fontFamily: 'monospace',
        border: '2px dashed rgba(255,255,255,0.5)',
        borderRadius: '8px',
        padding: '20px',
        backgroundColor: 'rgba(255,255,255,0.1)',
      }}>
        Drag elements here
      </div>
    </div>
  );
};

// Template Registry
export const VIDEO_TEMPLATES = {
  heroBanner: {
    name: 'Hero Banner',
    description: 'Full-screen banner with title and subtitle.',
    component: HeroBanner,
    schema: heroBannerSchema,
    defaultProps: {
      mainTitle: "Epic Title",
      subtitle: "Adventure awaits",
      backgroundImage: "https://via.placeholder.com/1920x1080/3b82f6/ffffff?text=Background",
      primaryColor: "#3b82f6",
      fontFamily: "Inter",
    },
  },
  lowerThird: {
    name: 'Lower Third',
    description: 'Lower third title block with optional logo.',
    component: LowerThird,
    schema: lowerThirdSchema,
    defaultProps: {
      title: "Your Title",
      backgroundColor: "#000000",
      textColor: "#ffffff",
    },
  },
  socialMedia: {
    name: 'Social Media',
    description: 'Compact social post layout with background and avatar.',
    component: SocialMedia,
    schema: socialMediaSchema,
    defaultProps: {
      title: "Social Media Post",
      backgroundImage: "https://via.placeholder.com/1080x608/667eea/ffffff?text=Social",
      userAvatar: "https://via.placeholder.com/40x40/667eea/ffffff?text=Avatar",
    },
  },
  blankScene: {
    name: 'Blank Scene',
    description: 'Empty scene with a drag hint.',
    component: BlankScene,
    schema: blankSceneSchema,
    defaultProps: {
      backgroundColor: "#1a1a2a",
    },
  },
};
