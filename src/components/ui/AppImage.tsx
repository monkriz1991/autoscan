import type { ImgHTMLAttributes } from "react";

export type AppImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  /** Явные размеры снижают CLS; задайте реальные px исходника. */
  width: number;
  height: number;
};

/**
 * Картинка с типовыми атрибутами производительности и CLS.
 */
export default function AppImage({ loading = "lazy", decoding = "async", ...rest }: AppImageProps) {
  return <img loading={loading} decoding={decoding} {...rest} />;
}
