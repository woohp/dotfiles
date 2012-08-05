vim_colors "wombat2" do
  author "Hui Peng Hu"
  notes "modified Wombat theme"

  reset true
  background :dark

  Normal "f6f3e8", "131313"
  Cursor "262626", "ffff87"
  NonText "808080", "303030"
  LineNr "857b6f", "000000"
  StatusLine "f6f3e8", "444444", :gui => "italic"
  StatusLineNC "857b6f", "444444"
  VertSplit "444444", "444444"
  Folded "384048", "a0a8b0"
  Title "f6f3e8", "NONE", :gui => "bold"
  Visual "f6f3e8", "505050"
  SpecialKey "808080", "343434"

  CursorLine nil, "2d2d2d"
  MatchParen "f6f3e8", "857b6f", :gui => "bold"
  Pmenu "f6f3e8", "444444"
  PmenuSel "000000", "cae682"

  Keyword "8ac6f2"
  Statement "8ac0f2"
  Constant "e5786d"
  Number "c996ff"
  PreProc "e5786d"
  Function "cae682"
  Identifier "cae682"
  Type "cae682"
  Include "d44444"
  Special "e7f6da"
  String "82c83c"
  Comment "99968b", :gui => "italic"
  Todo "8f8f8f"
  PreProc "c02929"

  link :FoldColumn, :to => :Folded
  link :CursorColumn, :to => :CursorLine
end

