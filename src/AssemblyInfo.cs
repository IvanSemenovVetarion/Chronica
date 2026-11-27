using System.Reflection;
using System.Runtime.InteropServices;

#if DND_EDITION
[assembly: AssemblyTitle("Chronika DnD Edition")]
[assembly: AssemblyDescription("Chronika DnD Edition — хранитель миров и игровой стол D&D. Автор: Vetarion.")]
[assembly: AssemblyProduct("Chronika DnD Edition")]
#else
[assembly: AssemblyTitle("Chronica")]
[assembly: AssemblyDescription("Chronica — хранитель миров. Настольная мастерская для фэнтезийных миров, героев и летописей. Автор: Vetarion.")]
[assembly: AssemblyProduct("Chronica")]
#endif
[assembly: AssemblyCompany("Vetarion")]
[assembly: AssemblyCopyright("Vetarion, 2026")]
[assembly: AssemblyVersion("2.0.1.0")]
[assembly: AssemblyFileVersion("2.0.1.0")]
[assembly: ComVisible(false)]
