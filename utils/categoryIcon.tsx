import { ReactElement } from 'react';
import {
  IconProps, IconPerson, IconBriefcase, IconMedical, IconPencil, IconHome, IconTag,
} from '../components/icons';

type IconComponent = (props: IconProps) => ReactElement;

const CATEGORY_ICON_MAP: Record<string, IconComponent> = {
  '업무': IconBriefcase,
  '개인': IconPerson,
  '건강': IconMedical,
  '학습': IconPencil,
  '가정': IconHome,
  '기타': IconTag,
};

export function getCategoryIcon(category: string): IconComponent {
  return CATEGORY_ICON_MAP[category] ?? IconTag;
}
