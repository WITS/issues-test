export default function handler(req, res) {
  res.json({
    number: Math.random(),
  });
}