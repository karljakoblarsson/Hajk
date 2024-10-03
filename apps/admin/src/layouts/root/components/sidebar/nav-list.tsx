import { Box, useTheme } from "@mui/material";
import { SIDEBAR_MENU, SIDEBAR_MINI_WIDTH } from "../../constants";
import PermanentButton from "./permanent-button";
import NavItem from "./nav-item";
import SquareIconButton from "./square-icon-button";
import SettingsIcon from "@mui/icons-material/Settings";
import { useNavigate } from "react-router-dom";

interface Props {
  setSidebarOpen: (open: boolean) => void;
  permanent: boolean;
  togglePermanent: () => void;
}
const NavList = (props: Props) => {
  const theme = useTheme();
  const navigate = useNavigate();

  const closeSidebarIfNeeded = () => {
    if (!props.permanent) {
      props.setSidebarOpen(false);
    }
  };

  return (
    <Box
      component="nav"
      sx={{
        position: "relative",
        height: "100vh",
        backgroundColor:
          theme.palette.mode === "light"
            ? theme.palette.background.default
            : "",
      }}
    >
      {SIDEBAR_MENU.map((link, index) => {
        return (
          <NavItem
            key={index + link.to}
            to={link.to}
            titleKey={link.titleKey}
            icon={link.icon}
            onClick={() => {
              closeSidebarIfNeeded();
            }}
          />
        );
      })}

      <SquareIconButton
        sx={{
          position: "absolute",
          bottom: `${SIDEBAR_MINI_WIDTH}px`,
          left: "0px",
          borderTopRightRadius: "50%",
        }}
        onClick={() => {
          navigate("/settings");
          closeSidebarIfNeeded();
        }}
      >
        <SettingsIcon fontSize="medium" />
      </SquareIconButton>
      <PermanentButton
        togglePermanent={props.togglePermanent}
        permanent={props.permanent}
        sx={{
          position: "absolute",
          bottom: `${SIDEBAR_MINI_WIDTH}px`,
          right: "0",
          borderTopLeftRadius: "50%",
        }}
      />
    </Box>
  );
};

export default NavList;
