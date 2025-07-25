// A simple card used on the landing page to highlight core benefits. Icons
// are passed in as React elements from react-icons. The card uses a dark
// background to contrast with the light page background.
export default function FeatureCard({ title, description, icon }) {
  return (
    <div className="bg-gray-800 text-white p-6 rounded-lg shadow-md flex flex-col items-start">
      <div className="text-3xl mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-300">{description}</p>
    </div>
  );
}