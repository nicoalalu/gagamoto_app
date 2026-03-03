import Image from "next/image";

export default function TeamAvatar({
  nombre,
  logo,
  size = 36,
}: {
  nombre: string;
  logo?: string | null;
  size?: number;
}) {
  const ini = nombre
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();

  if (logo) {
    return (
      <Image
        src={logo}
        alt={nombre}
        width={size}
        height={size}
        className="rounded-full object-cover border border-gray-200 shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0 border border-gray-200"
    >
      {ini}
    </div>
  );
}
