
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Utility function for merging class names
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Animation variants for staggered animations
export const fadeIn = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 10 },
  transition: { duration: 0.3 }
};

// Staggered children animation
export const staggerContainer = (staggerChildren: number = 0.1, delayChildren: number = 0) => ({
  hidden: {},
  show: {
    transition: {
      staggerChildren,
      delayChildren
    }
  }
});

// Card reveal animation
export const cardVariants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.95
  },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: [0.43, 0.13, 0.23, 0.96]
    }
  }),
  exit: { 
    opacity: 0, 
    y: 20,
    scale: 0.95,
    transition: {
      duration: 0.3
    }
  }
};

// Page transition
export const pageTransition = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: { 
      duration: 0.5,
      when: "beforeChildren",
      staggerChildren: 0.1
    }
  },
  exit: { 
    opacity: 0,
    transition: { 
      duration: 0.3 
    }
  }
};

// Answer selection animation
export const answerAnimation = {
  tap: { scale: 0.98 },
  hover: { scale: 1.02 },
  correct: { 
    backgroundColor: "rgba(34, 197, 94, 0.2)",
    borderColor: "rgba(34, 197, 94, 1)",
    transition: { duration: 0.3 }
  },
  incorrect: { 
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    borderColor: "rgba(239, 68, 68, 1)",
    transition: { duration: 0.3 }
  }
};

// Success animation
export const successAnimation = {
  initial: { scale: 0 },
  animate: { 
    scale: 1, 
    transition: { 
      type: "spring", 
      stiffness: 300, 
      damping: 20 
    }
  },
  exit: { scale: 0 }
};

// Apply blur and focus
export function blurOthers(items: HTMLElement[], currentIndex: number, blurAmount: string = "blur(2px)") {
  items.forEach((item, index) => {
    if (index !== currentIndex) {
      item.style.filter = blurAmount;
      item.style.opacity = "0.7";
    } else {
      item.style.filter = "none";
      item.style.opacity = "1";
    }
  });
}

// Reset blur
export function resetBlur(items: HTMLElement[]) {
  items.forEach(item => {
    item.style.filter = "none";
    item.style.opacity = "1";
  });
}
