import React from 'react';
import { 
  Menu as LucideMenu, 
  Globe as LucideGlobe, 
  Camera as LucideCamera, 
  Image as LucideImage, 
  Video as LucideVideo, 
  ArrowRight as LucideArrowRight, 
  Upload as LucideUpload, 
  FileText as LucideFileText, 
  ArrowLeft as LucideArrowLeft, 
  Loader2 as LucideLoader2, 
  Sparkles as LucideSparkles,
  Clock as LucideClock, 
  AlertCircle as LucideAlertCircle, 
  Share2 as LucideShare2, 
  Save as LucideSave, 
  LogOut as LucideLogOut, 
  ChevronDown as LucideChevronDown, 
  Eye as LucideEye, 
  Smile as LucideSmile, 
  Ear as LucideEar,
  Info as LucideInfo, 
  Heart as LucideHeart, 
  Activity as LucideActivity, 
  Puzzle as LucidePuzzle,
  Trash2 as LucideTrash2, 
  CheckCircle as LucideCheckCircle, 
  XCircle as LucideXCircle, 
  AlertTriangle as LucideAlertTriangle,
  BrainCircuit as LucideBrainCircuit
} from 'lucide-react-native';

interface IconProps {
  color?: string;
  size?: number;
  strokeWidth?: number;
  fill?: string;
  style?: any;
  className?: string;
}

export const Menu = (props: IconProps) => <LucideMenu {...props} />;
export const Globe = (props: IconProps) => <LucideGlobe {...props} />;
export const Camera = (props: IconProps) => <LucideCamera {...props} />;
export const Image = (props: IconProps) => <LucideImage {...props} />;
export const ImageIcon = (props: IconProps) => <LucideImage {...props} />;
export const Video = (props: IconProps) => <LucideVideo {...props} />;
export const ArrowRight = (props: IconProps) => <LucideArrowRight {...props} />;
export const UploadCloud = (props: IconProps) => <LucideUpload {...props} />;
export const FileText = (props: IconProps) => <LucideFileText {...props} />;
export const ArrowLeft = (props: IconProps) => <LucideArrowLeft {...props} />;
export const Loader2 = (props: IconProps) => <LucideLoader2 {...props} />;
export const Sparkles = (props: IconProps) => <LucideSparkles {...props} />;
export const Clock = (props: IconProps) => <LucideClock {...props} />;
export const AlertCircle = (props: IconProps) => <LucideAlertCircle {...props} />;
export const Share = (props: IconProps) => <LucideShare2 {...props} />;
export const Save = (props: IconProps) => <LucideSave {...props} />;
export const LogOut = (props: IconProps) => <LucideLogOut {...props} />;
export const History = (props: IconProps) => <LucideClock {...props} />;
export const ChevronDown = (props: IconProps) => <LucideChevronDown {...props} />;
export const Eye = (props: IconProps) => <LucideEye {...props} />;
export const Smile = (props: IconProps) => <LucideSmile {...props} />;
export const Ear = (props: IconProps) => <LucideEar {...props} />;
export const Info = (props: IconProps) => <LucideInfo {...props} />;
export const Heart = (props: IconProps) => <LucideHeart {...props} />;
export const Activity = (props: IconProps) => <LucideActivity {...props} />;
export const Puzzle = (props: IconProps) => <LucidePuzzle {...props} />;
export const Trash = (props: IconProps) => <LucideTrash2 {...props} />;
export const CheckCircle = (props: IconProps) => <LucideCheckCircle {...props} />;
export const XCircle = (props: IconProps) => <LucideXCircle {...props} />;
export const AlertTriangle = (props: IconProps) => <LucideAlertTriangle {...props} />;
export const BrainCircuit = (props: IconProps) => <LucideBrainCircuit {...props} />;
