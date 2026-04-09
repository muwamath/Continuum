interface IconProps {
  name: string
  size?: number
  alt?: string
  className?: string
}

export function Icon({ name, size = 24, alt = '', className }: IconProps) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}icons/${name}.svg`}
      width={size}
      height={size}
      alt={alt}
      role="img"
      className={className}
      style={{ display: 'block' }}
    />
  )
}
