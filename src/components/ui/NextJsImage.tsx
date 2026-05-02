import Image from 'next/image';
import { RenderSlideProps, isImageSlide } from 'yet-another-react-lightbox';

export default function NextJsImage({ slide }: RenderSlideProps) {
  if (!isImageSlide(slide)) return undefined;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Image
        fill
        alt={slide.alt || ''}
        src={slide.src}
        priority
        draggable={false}
        unoptimized
        style={{ objectFit: 'contain' }}
        sizes="100vw"
      />
    </div>
  );
}
