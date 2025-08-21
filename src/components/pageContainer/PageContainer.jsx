import PropTypes from 'prop-types';

function PageContainer({ children }) {
  return <div className="page-container">{children}</div>;
}

PageContainer.propTypes = {
  children: PropTypes.node.isRequired,
};

export default PageContainer;
