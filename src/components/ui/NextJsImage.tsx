import Image from 'next/image';
import { RenderSlideProps, isImageSlide } from 'yet-another-react-lightbox';

export default function NextJsImage({ slide, rect }: RenderSlideProps) {
  if (!isImageSlide(slide)) return undefined;

  // Render using Next.js Image for better caching and loading handling
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Image
        fill
        alt={slide.alt || ''}
        src={slide.src}
        loading="eager"
        draggable={false}
        unoptimized // Prevents double compression by Next.js, serving the sharp 92% WebP from Vercel Blob
        style={{ objectFit: 'contain' }}
        sizes={
          typeof window !== 'undefined'
            ? `${Math.ceil((rect.width / window.innerWidth) * 100)}vw`
            : '100vw'
        }
      />
    </div>
  );
}
