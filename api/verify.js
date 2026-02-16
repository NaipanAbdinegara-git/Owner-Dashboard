export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send();

  const { code } = req.body;
  
  // Langsung tembak di sini karena repo private
  const MASTER_CODE = "NAzka23_04"; 

  if (code === MASTER_CODE) {
    return res.status(200).json({ success: true });
  } else {
    return res.status(401).json({ success: false });
  }
}