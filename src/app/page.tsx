import Link from 'next/link';
import { listBooks } from '@/lib/books';

export default async function Home() {
  const books = await listBooks();

  return (
    <main className="min-h-screen px-6 py-10 max-w-3xl mx-auto">
      <header className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight">水水的绘本 📚</h1>
        <p className="mt-2 text-gray-500">
          专属定制故事 · 主角永远是水水
        </p>
      </header>

      <section className="mb-8">
        <Link
          href="/editor"
          className="inline-block bg-shuishui-pink text-white font-medium px-5 py-3 rounded-2xl hover:opacity-90 active:scale-95 transition"
        >
          ＋ 新建一本绘本
        </Link>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4 text-gray-700">已出版</h2>
        {books.length === 0 ? (
          <div className="text-gray-400 py-12 text-center border-2 border-dashed border-gray-200 rounded-2xl">
            还没有绘本——点上面的按钮新建一本吧
          </div>
        ) : (
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {books.map((b) => (
              <li key={b.id}>
                <Link
                  href={`/books/${b.id}`}
                  className="block aspect-[3/4] bg-shuishui-pink-soft rounded-xl shadow-sm hover:shadow-md transition overflow-hidden relative group"
                >
                  <div className="absolute inset-0 flex flex-col justify-end p-4 bg-gradient-to-t from-black/40 via-transparent">
                    <h3 className="text-white font-semibold text-base leading-tight">
                      {b.title}
                    </h3>
                    {b.subtitle && (
                      <p className="text-white/80 text-xs mt-1">{b.subtitle}</p>
                    )}
                  </div>
                  {b.cover_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={b.cover_image}
                      alt={b.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl">
                      🐰
                    </div>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
