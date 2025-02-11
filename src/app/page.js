import CuentasList from '../components/CuentasList';
import FloatingButton from '../components/FloatingButton';

export default function Home() {
  return (
    <div className="container mx-auto p-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Twitter Helper</h1>
        <p className="text-gray-600 mt-2">Genera contenido optimizado para Twitter</p>
      </div>
      <CuentasList />
      <FloatingButton />
    </div>
  )
}
