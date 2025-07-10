# Windows 7 兼容性安装脚本
!include LogicLib.nsh
!include WinVer.nsh

# 检查 Windows 版本
Function .onInit
  ${If} ${AtLeastWin7}
    # Windows 7 或更高版本，继续安装
  ${Else}
    MessageBox MB_OK|MB_ICONSTOP "此应用程序需要 Windows 7 或更高版本。"
    Abort
  ${EndIf}
FunctionEnd

# 检查必要的运行时库
Function CheckVCRedist
  # 检查 Visual C++ Redistributable
  ReadRegStr $0 HKLM "SOFTWARE\Microsoft\VisualStudio\14.0\VC\Runtimes\x64" "Version"
  StrCmp $0 "" 0 vcredist_installed
  
  MessageBox MB_YESNO "需要安装 Visual C++ Redistributable 2015-2019。是否继续安装？" IDYES download_vcredist
  Abort
  
  download_vcredist:
  MessageBox MB_OK "请手动下载并安装 Visual C++ Redistributable 2015-2019 x64 版本。"
  
  vcredist_installed:
FunctionEnd

# 在安装前调用检查
Section "Check"
  Call CheckVCRedist
SectionEnd
