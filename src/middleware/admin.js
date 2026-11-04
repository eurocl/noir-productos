export default function requireAdmin(req, res, next) {
  // Old tokens and accounts without a role have no administrative privileges.
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Solo un administrador puede modificar el catálogo" });
  }
  next();
}
