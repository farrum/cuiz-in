
export const getSizeClasses = (size?: 'small' | 'medium' | 'large'): string => {
  switch (size) {
    case 'small':
      return 'px-2 py-2';
    case 'large':
      return 'px-6 py-4';
    default:
      return 'px-4 py-3';
  }
};

export const getPositionClasses = (position: string): string => {
  switch (position) {
    case 'top':
      return 'mb-6';
    case 'bottom':
      return 'mt-6';
    case 'left':
      return 'mr-6';
    case 'right':
      return 'ml-6';
    case 'sidebar':
      return 'mx-2 my-4';
    case 'middle':
      return 'my-6';
    default:
      return 'mb-6';
  }
};
