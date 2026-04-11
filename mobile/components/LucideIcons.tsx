import React from 'react';
import { Feather, Ionicons } from '@expo/vector-icons';

interface IconProps {
  color?: string;
  size?: number;
  style?: any;
}

export const Menu = (props: IconProps) => <Feather name="menu" {...props} />;
export const Globe = (props: IconProps) => <Feather name="globe" {...props} />;
export const Camera = (props: IconProps) => <Feather name="camera" {...props} />;
export const Image = (props: IconProps) => <Feather name="image" {...props} />;
export const ImageIcon = (props: IconProps) => <Feather name="image" {...props} />;
export const Video = (props: IconProps) => <Feather name="video" {...props} />;
export const ArrowRight = (props: IconProps) => <Feather name="arrow-right" {...props} />;
export const UploadCloud = (props: IconProps) => <Feather name="upload-cloud" {...props} />;
export const FileText = (props: IconProps) => <Feather name="file-text" {...props} />;
export const ArrowLeft = (props: IconProps) => <Feather name="arrow-left" {...props} />;
export const Loader2 = (props: IconProps) => <Feather name="loader" {...props} />;
export const Sparkles = (props: IconProps) => <Ionicons name="sparkles" {...props} />;
export const Clock = (props: IconProps) => <Feather name="clock" {...props} />;
