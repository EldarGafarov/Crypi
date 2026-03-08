// pages/index.js
import Link from 'next/link';
import StudentCard from '../components/StudentCard';

export default function About() {
  const students = [
    {
      name: 'Ben Zacai',
      linkedin: 'https://www.linkedin.com/in/ben-zakai/',
      image: 'https://res.cloudinary.com/dz7qpc3nu/image/upload/v1771779694/ben_rigidc.jpg',
      workplace: <>Cyber Security Software Developer <br />B.Sc Software Engineer</>,
    },
    {
      name: 'Eldar Gafarov',
      linkedin: 'https://www.linkedin.com/in/eldar-gafarov/',
      image: 'https://res.cloudinary.com/dz7qpc3nu/image/upload/v1771779696/eldar_e5a6yk.jpg',
      workplace: <>Software Developer <br />B.Sc Software Engineer </>,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-8
      bg-white dark:bg-gradient-to-r dark:from-gray-800 dark:via-gray-900 dark:to-black">

      {/* Main content */}
      <div className="relative z-10 text-center px-6 w-full max-w-7xl">
        {/* Heading */}
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-wide mb-4
          text-cyan-400">
          About Us
        </h1>
        <p className="text-lg md:text-xl font-light mb-8 max-w-2xl mx-auto
          text-gray-800 dark:text-white">
          We are a team of 2 students from Braude College of Engineering: <br />Ben Zacai & Eldar Gafarov.
        </p>

        <p className="text-lg md:text-xl font-light mb-8 max-w-3xl mx-auto
          text-gray-800 dark:text-white">
          This application was built as part of our Web Technologies course project. It provides live cryptocurrency prices, historical graphs, and detailed information about various coins.
        </p>

        <p className="text-lg md:text-xl font-light mb-8 max-w-2xl mx-auto
          text-gray-800 dark:text-white">
          Meet the team behind the project:
        </p>

        {/* Students Grid */}
        <div className="flex flex-wrap justify-center gap-6 mb-8">
          {students.map((student, index) => (
            <StudentCard
              key={index}
              name={student.name}
              linkedin={student.linkedin}
              image={student.image}
              workplace={student.workplace}
            />
          ))}
        </div>

        {/* Go to Dashboard button */}
        <div className="flex justify-center mt-8">
          <Link href="/dashboard" legacyBehavior>
            <a className="bg-cyan-500 hover:bg-cyan-600 text-white py-3 px-6 rounded-lg shadow-lg text-lg transition">
              Go to Dashboard
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
}
