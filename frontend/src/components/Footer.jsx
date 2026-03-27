export default function Footer() {
  return (
    <footer className="border-t border-[#e8f2ef] dark:border-white/10 py-12">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="size-6 bg-primary rounded-md"></div>
              <h2 className="text-lg font-bold tracking-tight">Lumina AI</h2>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">Pioneering the future of auditory learning. Designed for students, by students.</p>
          </div>
          <div>
            <h4 className="font-bold mb-6">Platform</h4>
            <ul className="flex flex-col gap-4 text-sm text-gray-500 dark:text-gray-400">
              <li><a className="hover:text-primary transition-colors" href="#">How it works</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Pricing</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Security</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6">Company</h4>
            <ul className="flex flex-col gap-4 text-sm text-gray-500 dark:text-gray-400">
              <li><a className="hover:text-primary transition-colors" href="#">About Us</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Careers</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6">Legal</h4>
            <ul className="flex flex-col gap-4 text-sm text-gray-500 dark:text-gray-400">
              <li><a className="hover:text-primary transition-colors" href="#">Privacy</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Terms</a></li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-[#e8f2ef] dark:border-white/5 text-sm text-gray-400">
          <p>© 2024 Lumina AI Technologies. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a className="hover:text-primary" href="#"><span className="material-symbols-outlined">public</span></a>
            <a className="hover:text-primary" href="#"><span className="material-symbols-outlined">alternate_email</span></a>
          </div>
        </div>
      </div>
    </footer>
  );
}
